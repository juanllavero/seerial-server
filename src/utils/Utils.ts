import ApiError from "@/data/ApiError";
import { Request } from "express";

export const extraTypes = [
  "behindthescenes",
  "concert",
  "interview",
  "live",
  "lyrics",
  "video",
];
export const videoExtensions = [
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mpeg",
  ".m2ts",
  ".webm",
];
export const audioExtensions = [
  ".mp3",
  ".flac",
  ".wav",
  ".m4a",
  ".ogg",
  ".aac",
  ".wma",
  ".webm",
  ".caf",
];
export const imageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".webp",
  ".svg",
];

export const getUserId = (req: Request) => {
  const userId = (req as any).user?.id;
  if (!userId) throw new ApiError(401, "User authentication is required.");
  return userId;
};
