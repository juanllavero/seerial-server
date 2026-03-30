import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import type { UserDTO } from '@/api/v1/users/application/dtos/UserDTOs';
import { UserModel } from '@/api/v1/users/infrastructure/persistence/models/UserModel';
import { messages } from '@/config/messages';
import { UserType } from '@/utils/constants';
import logger from '../utils/logger';

/**
 * Function required by tsoa to handle authentication
 * @param request Express request
 * @param securityName Name of the security scheme (bearerAuth, cookieAuth, cookieAuthFast, adminAuth, managementAuth, public)
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
): Promise<UserDTO | null> {
  switch (securityName) {
    case 'public':
      return null;
    case 'bearerAuth':
    case 'cookieAuth':
      return await authenticateFull(request);
    case 'cookieAuthFast':
      return await authenticateFast(request);
    case 'adminAuth':
      return await authenticateAdmin(request);
    case 'managementAuth':
      return await authenticateManagement(request);
    default:
      throw new Error('Unsupported authentication method');
  }
}

function getTokenFromRequest(request: Request): string | null {
  const cookieToken = request.cookies?.token as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  const authorization = request.headers.authorization;
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

async function authenticateFull(request: Request): Promise<UserDTO> {
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new UnauthorizedException(messages.errors.token.missing);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '') as {
      userId: string;
    };

    const user = await UserModel.findOne({
      where: { id: decoded.userId },
      //relations: ["libraries"],
    });

    if (!user) {
      throw new NotFoundException(messages.errors.notFound.user);
    }

    // Check library access if route involves a library
    // const libraryId = request.params?.libraryId || request.body?.libraryId;
    // if (user.type !== UserType.ADMIN && libraryId) {
    //   const hasAccess = user.userLibraries?.some(
    //     (lib) => lib.library && lib.library.id === libraryId
    //   );
    //   if (!hasAccess) {
    //     throw new Error(messages.errors.token.noAccess);
    //   }
    // }

    // Check remote access
    const ip = getClientIp(request);
    if (!isLoopback(ip) && !user.allowRemote) {
      throw new UnauthorizedException(messages.errors.token.noRemoteAccess);
    }

    // Check session limit (omitted in original tsoa auth for simplicity)

    return user;
  } catch (err) {
    logger.error(err, '[Authentication] Error');
    throw new UnauthorizedException(messages.errors.token.invalid);
  }
}

async function authenticateFast(request: Request): Promise<UserDTO> {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new UnauthorizedException(messages.errors.token.missing);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '') as {
      userId: string;
    };
    const user = await UserModel.findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new UnauthorizedException(messages.errors.token.invalid);
    }

    return user;
  } catch (err) {
    logger.error(err, '[Authentication] Error');
    throw new UnauthorizedException(messages.errors.token.invalid);
  }
}

async function authenticateAdmin(request: Request): Promise<UserDTO> {
  const token = getTokenFromRequest(request);
  if (!token) {
    throw new UnauthorizedException(messages.errors.token.missing);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? '') as {
      userId: string;
      type: string;
    };
    const user = await UserModel.findOne({ where: { id: decoded.userId } });
    if (!user || user.type !== UserType.ADMIN) {
      throw new ForbiddenException(messages.errors.token.noAccess);
    }
    return user;
  } catch (err) {
    logger.error(err, '[Authentication] Error');
    throw new UnauthorizedException(messages.errors.token.invalid);
  }
}

async function authenticateManagement(request: Request): Promise<UserDTO | null> {
  const ip = getClientIp(request);
  const isLocal = isLoopback(ip);

  const token = getTokenFromRequest(request) ?? undefined;

  // Local request: allow access
  if (isLocal) {
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || '';
        if (!secret) throw new Error('Missing JWT_SECRET');
        const decoded = jwt.verify(token, secret) as { userId: string };
        const user = await UserModel.findOne({
          where: { id: decoded.userId },
        });
        if (user) return user;
      } catch (_e) {}
    }
    return null; // Allow local access without user
  }

  // Remote request: check token and admin user
  if (!token) {
    throw new UnauthorizedException(messages.errors.token.missing);
  }

  try {
    const secret = process.env.JWT_SECRET || '';
    if (!secret) {
      throw new Error('Server misconfigured (JWT secret missing)');
    }

    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = await UserModel.findOne({ where: { id: decoded.userId } });
    if (!user) {
      throw new UnauthorizedException(messages.errors.token.invalid);
    }

    if (user.type === UserType.ADMIN) {
      return user;
    }

    throw new ForbiddenException(messages.errors.token.noAccess);
  } catch (err) {
    logger.error(err, '[Authentication] Error');
    throw new UnauthorizedException(messages.errors.token.invalid);
  }
}

// Auxiliary functions
function getClientIp(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string) || '';
  if (xff) return xff.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || '';
}

function isLoopback(ip: string): boolean {
  if (!ip) return false;
  if (ip === '::1' || ip === '127.0.0.1') return true;
  if (ip.startsWith('::ffff:')) {
    const mapped = ip.replace('::ffff:', '');
    if (mapped === '127.0.0.1' || mapped.startsWith('127.')) return true;
  }
  if (ip.startsWith('::1')) return true;
  if (ip.startsWith('127.')) return true;
  return false;
}
