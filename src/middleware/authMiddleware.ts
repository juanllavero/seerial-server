import { NextFunction, Request, Response } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import { API_URL } from "../utils/constants";
import { FilesManager } from "../utils/FilesManager";

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

interface CacheEntry {
  userId: string;
  user?: any;
  expiresAt: number;
  accessType?: "owner" | "shared";
}

class AuthMiddleware {
  private serverId: string | null = null;
  private tokenCache: Map<string, CacheEntry> = new Map();
  private pendingValidations: Map<
    string,
    Promise<{
      valid: boolean;
      userId?: string;
      user?: any;
      accessType?: string;
    }>
  > = new Map();

  // Longer cache duration for known tokens
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly VALIDATION_TIMEOUT = 5000; // 5 seconds timeout

  constructor() {
    this.loadServerId();

    // Clean cache every 5 minutes
    this.startCacheCleanup();
  }

  private loadServerId(): void {
    try {
      const serverIdPath = FilesManager.getExternalPath(
        "resources/config/server.id"
      );
      if (fs.existsSync(serverIdPath)) {
        this.serverId = fs.readFileSync(serverIdPath, "utf8").trim();
      }
    } catch (error) {
      console.error("Error loading server ID:", error);
    }
  }

  // Clean cache every 5 minutes
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [token, entry] of this.tokenCache.entries()) {
        if (entry.expiresAt <= now) {
          this.tokenCache.delete(token);
        }
      }
    }, 5 * 60 * 1000);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as DecodedToken;
      if (!decoded || !decoded.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      // 30 seconds buffer to avoid timing issues
      return decoded.exp < currentTime + 30;
    } catch {
      return true;
    }
  }

  private async validateTokenWithCentral(token: string): Promise<{
    valid: boolean;
    userId?: string;
    user?: any;
    accessType?: string;
  }> {
    // Wait for the result if there is already a validation in progress for this token
    const pendingValidation = this.pendingValidations.get(token);
    if (pendingValidation) {
      return pendingValidation;
    }

    // Check cache first
    const cached = this.tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        valid: true,
        userId: cached.userId,
        user: cached.user,
        accessType: cached.accessType,
      };
    }

    // Create validation promise
    const validationPromise = this.performValidation(token, "owner");
    this.pendingValidations.set(token, validationPromise);

    try {
      const result = await validationPromise;
      return result;
    } finally {
      this.pendingValidations.delete(token);
    }
  }

  private async validateSharedAccess(token: string): Promise<{
    valid: boolean;
    userId?: string;
    user?: any;
    accessType?: string;
  }> {
    const pendingValidation = this.pendingValidations.get(token + "_shared");
    if (pendingValidation) {
      return pendingValidation;
    }

    const cached = this.tokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        valid: true,
        userId: cached.userId,
        user: cached.user,
        accessType: cached.accessType,
      };
    }

    const validationPromise = this.performValidation(token, "shared");
    this.pendingValidations.set(token + "_shared", validationPromise);

    try {
      const result = await validationPromise;
      return result;
    } finally {
      this.pendingValidations.delete(token + "_shared");
    }
  }

  private async performValidation(
    token: string,
    type: "owner" | "shared"
  ): Promise<{
    valid: boolean;
    userId?: string;
    user?: any;
    accessType?: string;
  }> {
    const endpoint =
      type === "owner"
        ? "validate-server-access"
        : "validate-server-shared-access";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.VALIDATION_TIMEOUT
      );

      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          serverId: this.serverId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return { valid: false };
      }

      const result: any = await response.json();

      if (result.valid && result.userId) {
        // Longer cache duration
        this.tokenCache.set(token, {
          userId: result.userId,
          user: result.user,
          accessType: result.accessType || type,
          expiresAt: Date.now() + this.CACHE_DURATION,
        });

        return {
          valid: true,
          userId: result.userId,
          user: result.user,
          accessType: result.accessType || type,
        };
      }

      return { valid: false };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Token validation timed out");
      } else {
        console.error("Error validating token with central server:", error);
      }
      return { valid: false };
    }
  }

  // Pre-validation in the background without blocking
  private async preValidateToken(token: string): Promise<void> {
    if (this.tokenCache.has(token)) return;

    // Validate in background without blocking
    setTimeout(async () => {
      try {
        await this.validateSharedAccess(token);
      } catch (error) {
        // Ignore errors in pre-validation
      }
    }, 100);
  }

  public requireOwner = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      if (this.isTokenExpired(token)) {
        res.status(401).json({ error: "Token expired" });
        return;
      }

      if (!this.serverId) {
        res.status(500).json({ error: "Server not properly configured" });
        return;
      }

      const validation = await this.validateTokenWithCentral(token);

      if (!validation.valid) {
        res
          .status(403)
          .json({ error: "Access denied: Invalid token or not server owner" });
        return;
      }

      req.userId = validation.userId;
      req.user = validation.user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Authentication error" });
    }
  };

  public requireAccess = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      if (this.isTokenExpired(token)) {
        res.status(401).json({ error: "Token expired" });
        return;
      }

      if (!this.serverId) {
        res.status(500).json({ error: "Server not properly configured" });
        return;
      }

      // Pre-validate token for future requests
      this.preValidateToken(token);

      const validation = await this.validateSharedAccess(token);

      if (!validation.valid) {
        res.status(403).json({
          error: "Access denied: No permission to access this server",
        });
        return;
      }

      req.userId = validation.userId;
      req.user = validation.user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Authentication error" });
    }
  };

  // Optimized middleware for highly accessed routes
  public requireAccessFast = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      // Fast cache validation without remote validation if in cache
      const cached = this.tokenCache.get(token);
      if (cached && cached.expiresAt > Date.now()) {
        req.userId = cached.userId;
        req.user = cached.user;
        next();
        return;
      }

      // Normal validation if not in cache
      if (this.isTokenExpired(token)) {
        res.status(401).json({ error: "Token expired" });
        return;
      }

      if (!this.serverId) {
        res.status(500).json({ error: "Server not properly configured" });
        return;
      }

      const validation = await this.validateSharedAccess(token);

      if (!validation.valid) {
        res.status(403).json({
          error: "Access denied: No permission to access this server",
        });
        return;
      }

      req.userId = validation.userId;
      req.user = validation.user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ error: "Authentication error" });
    }
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    return null;
  }

  // Preload cache for a specific user
  public async preloadUserCache(token: string): Promise<void> {
    if (!this.tokenCache.has(token)) {
      await this.validateSharedAccess(token);
    }
  }

  public clearCache(): void {
    this.tokenCache.clear();
    this.pendingValidations.clear();
  }

  // Performance metrics
  public getCacheStats(): { size: number; hitRate?: number } {
    return {
      size: this.tokenCache.size,
    };
  }
}

export default AuthMiddleware;
