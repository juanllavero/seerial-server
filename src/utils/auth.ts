import ApiError from "@/data/ApiError";
import { Request } from "express";

export const getUserId = (req: Request) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, "User authentication is required.");
  return userId;
};
