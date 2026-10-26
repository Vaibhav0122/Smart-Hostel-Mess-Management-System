import { UserRole, UserStatus } from "../constants/roles";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  studentId?: string | null;
  status: UserStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
