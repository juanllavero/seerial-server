import { UnauthorizedException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import { Request } from "express";

export const getUserId = (req: Request) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new UnauthorizedException(messages.errors.token.missing);
  return userId;
};
