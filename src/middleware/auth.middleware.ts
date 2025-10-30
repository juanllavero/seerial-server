import { UserModel } from "@/api/v0/users/infrastructure/persistence/models/UserModel";
import { messages } from "@/config/messages";
import { UserType } from "@/utils/constants";
import { NextFunction } from "express";
import jwt from "jsonwebtoken";

export default class AuthMiddleware {
  async requireAccess(req: any, res: any, next: NextFunction) {
    const token = req.cookies.jwt; // Read from cookie
    if (!token)
      return res.status(401).json({ error: messages.errors.token.missing });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as {
        userId: string;
      };
      const user = await UserModel.findByPk(decoded.userId, {
        include: ["libraries"],
      });

      if (!user)
        return res.status(401).json({ error: messages.errors.token.invalid });

      // Check library access if route involves a library
      const libraryId = req.params?.libraryId || req.body?.libraryId;
      if (user.type !== UserType.ADMIN && libraryId) {
        const hasAccess = user.libraries?.some((lib) => lib.id === libraryId);
        if (!hasAccess)
          return res
            .status(403)
            .json({ error: messages.errors.token.noAccess });
      }

      // Check remote access
      if (req.ip !== "127.0.0.1" && !user.allowRemote) {
        return res
          .status(403)
          .json({ error: messages.errors.token.noRemoteAccess });
      }

      // Check session limit
      if (user.maxSessions > 0) {
        // Implement session tracking (e.g., store active sessions in memory or DB)
        // For simplicity, assume middleware can track; otherwise, add session store
      }

      req.user = user; // Attach user to request
      next();
    } catch (err) {
      console.log("[AuthMiddleware] Error:", err);
      return res.status(401).json({ error: messages.errors.token.invalid });
    }
  }

  async requireAccessFast(req: any, res: any, next: NextFunction) {
    const token = req.cookies.jwt; // Read from cookie
    if (!token)
      return res.status(401).json({ error: messages.errors.token.missing });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as {
        userId: string;
      };
      const user = await UserModel.findByPk(decoded.userId);
      if (!user)
        return res.status(401).json({ error: messages.errors.token.invalid });

      req.user = user;
      next();
    } catch (err) {
      console.log("[AuthMiddleware] Error:", err);
      return res.status(401).json({ error: messages.errors.token.invalid });
    }
  }

  async requireAdmin(req: any, res: any, next: NextFunction) {
    const token = req.cookies.jwt; // Read from cookie
    if (!token)
      return res.status(401).json({ error: messages.errors.token.missing });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as {
        userId: string;
        type: string;
      };
      const user = await UserModel.findByPk(decoded.userId);
      if (!user || user.type !== UserType.ADMIN) {
        return res.status(403).json({ error: messages.errors.token.noAccess });
      }
      req.user = user;
      next();
    } catch (err) {
      console.log("[AuthMiddleware] Error:", err);
      return res.status(401).json({ error: messages.errors.token.invalid });
    }
  }

  /**
   * Middleware for critical management routes.
   * Allows access if the request is local (from the server) or if the authenticated user is an administrator.
   */
  async requireManagementAccess(req: any, res: any, next: NextFunction) {
    const ip = AuthMiddleware.getClientIp(req);
    const isLocal = AuthMiddleware.isLoopback(ip);

    const token = req.cookies?.jwt as string | undefined;

    // Local request: allow access
    if (isLocal) {
      if (token) {
        try {
          const secret = process.env.JWT_SECRET || "";
          if (!secret) throw new Error("Missing JWT_SECRET");
          const decoded = jwt.verify(token, secret) as { userId: string };
          const user = await UserModel.findByPk(decoded.userId);
          if (user) (req as any).user = user;
        } catch (e) {}
      }
      return next();
    }

    // Remote request: check token and admin user
    if (!token) {
      return res.status(401).json({ error: messages.errors.token.missing });
    }

    try {
      const secret = process.env.JWT_SECRET || "";
      if (!secret) {
        return res
          .status(500)
          .json({ error: "Server misconfigured (JWT secret missing)" });
      }

      const decoded = jwt.verify(token, secret) as { userId: string };
      const user = await UserModel.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: messages.errors.token.invalid });
      }

      (req as any).user = user;

      if (user.type === UserType.ADMIN) {
        return next();
      }

      return res.status(403).json({
        error: "Forbidden",
        message: messages.errors.token.noAccess,
      });
    } catch (err) {
      console.log("[AuthMiddleware] Error:", err);
      return res.status(401).json({ error: messages.errors.token.invalid });
    }
  }

  static getClientIp(req: any): string {
    // X-Forwarded-For may be a list, so we take the first
    const xff = (req.headers["x-forwarded-for"] as string) || "";
    if (xff) return xff.split(",")[0].trim();
    // express provides req.ip; fallback to socket
    return (
      (req.ip as string) ||
      (req.connection && (req.connection as any).remoteAddress) ||
      (req.socket && (req.socket as any).remoteAddress) ||
      ""
    );
  }

  static isLoopback(ip: string): boolean {
    if (!ip) return false;
    // Normalize common addresses
    if (ip === "::1" || ip === "127.0.0.1") return true;
    // IPv4-mapped IPv6: ::ffff:127.0.0.1  (and variants like ::ffff:127.x.x.x)
    if (ip.startsWith("::ffff:")) {
      const mapped = ip.replace("::ffff:", "");
      if (mapped === "127.0.0.1" || mapped.startsWith("127.")) return true;
    }
    // Weird case with scope id: "::1%lo0"
    if (ip.startsWith("::1")) return true;
    // 127.* addresses
    if (ip.startsWith("127.")) return true;
    return false;
  }
}
