import { UserModel } from "@/api/v0/users/infrastructure/persistence/models/UserModel";
import { messages } from "@/config/messages";
import { UserType } from "@/utils/constants";
import { Request } from "express";
import jwt from "jsonwebtoken";

/**
 * Function required by tsoa to handle authentication
 * @param request Express request
 * @param securityName Name of the security scheme (bearerAuth, cookieAuth, etc.)
 * @param scopes Optional scopes (if using specific roles)
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === "bearerAuth" || securityName === "cookieAuth") {
    const token = request.cookies.jwt;

    if (!token) {
      throw new Error(messages.errors.token.missing);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as {
        userId: string;
      };

      const user = await UserModel.findByPk(decoded.userId, {
        include: ["libraries"],
      });

      if (!user) {
        throw new Error(messages.errors.token.invalid);
      }

      // If you need to validate scopes (roles)
      if (scopes && scopes.length > 0) {
        // Validate admin role
        if (scopes.includes("admin") && user.type !== UserType.ADMIN) {
          throw new Error(messages.errors.token.noAccess);
        }
      }

      // Check library access if route involves a library
      const libraryId = request.params?.libraryId || request.body?.libraryId;
      if (user.type !== UserType.ADMIN && libraryId) {
        const hasAccess = user.libraries?.some((lib) => lib.id === libraryId);
        if (!hasAccess) {
          throw new Error(messages.errors.token.noAccess);
        }
      }

      // Check remote access
      const ip = getClientIp(request);
      if (!isLoopback(ip) && !user.allowRemote) {
        throw new Error(messages.errors.token.noRemoteAccess);
      }

      return user; // tsoa adds this to req.user automatically
    } catch (err) {
      console.log("[Authentication] Error:", err);
      throw new Error(messages.errors.token.invalid);
    }
  }

  throw new Error("Unsupported authentication method");
}

// Auxiliary functions
function getClientIp(req: Request): string {
  const xff = (req.headers["x-forwarded-for"] as string) || "";
  if (xff) return xff.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "";
}

function isLoopback(ip: string): boolean {
  if (!ip) return false;
  if (ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("::ffff:")) {
    const mapped = ip.replace("::ffff:", "");
    if (mapped === "127.0.0.1" || mapped.startsWith("127.")) return true;
  }
  if (ip.startsWith("::1")) return true;
  if (ip.startsWith("127.")) return true;
  return false;
}
