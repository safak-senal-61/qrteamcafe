import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    sessionId?: string;
  };
}
