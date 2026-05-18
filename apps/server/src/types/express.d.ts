import type { UserDTO } from '@/api/v1/users/application/dtos/UserDTOs';
import 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: UserDTO;
      refreshedToken?: string;
    }
  }
}
