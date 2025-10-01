import { messages } from "@/config/messages";
import { User } from "@/data/models/Main/User.model";
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
      const user = await User.findByPk(decoded.userId, {
        include: ["libraries"],
      });
      if (!user)
        return res.status(401).json({ error: messages.errors.token.invalid });

      // Check library access if route involves a library
      const libraryId = req.params.libraryId || req.body.libraryId;
      if (libraryId) {
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
      const user = await User.findByPk(decoded.userId);
      if (!user)
        return res.status(401).json({ error: messages.errors.token.invalid });

      req.user = user;
      next();
    } catch (err) {
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
      const user = await User.findByPk(decoded.userId);
      if (!user || user.type !== UserType.ADMIN) {
        return res.status(403).json({ error: messages.errors.token.noAccess });
      }
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: messages.errors.token.invalid });
    }
  }

  /**
   * Middleware for critical management routes.
   * Allows access if the request is local (from the server) or if the authenticated user is an administrator.
   */
  async requireManagementAccess(req: any, res: any, next: NextFunction) {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: messages.errors.token.missing });
    }

    try {
      // Authenticate the user (get token, verify it and search in DB)
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as {
        userId: string;
      };

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: messages.errors.token.invalid });
      }

      // Attach the user to the request for later use
      (req as any).user = user;

      // Apply the authorization logic
      const localIPs = ["::1", "127.0.0.1"];
      const isLocal = localIPs.includes(req.ip);

      // If it's local, allow access and pass to the next middleware/controller
      if (isLocal) {
        return next();
      }

      // If it's remote, check if it's an administrator
      if (user.type === UserType.ADMIN) {
        return next();
      }

      // If it's remote and NOT an administrator, deny access
      return res.status(403).json({
        error: "Forbidden",
        message: messages.errors.token.noAccess,
      });
    } catch (err) {
      return res.status(401).json({ error: messages.errors.token.invalid });
    }
  }
}
