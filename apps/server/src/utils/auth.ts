import type { Request } from 'express';
import { UnauthorizedException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';

export const getUserId = (req: Request) => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedException(messages.errors.token.missing);
  return userId;
};
