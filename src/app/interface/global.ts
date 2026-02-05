/* eslint-disable @typescript-eslint/no-namespace */
import { Types } from "mongoose";
import { Server as SocketIo } from "socket.io";

export interface JwtPayload {
  user: Types.ObjectId | string;
  email: string;
  role: "office_admin" | "worker" | "admin";
  iat?: number;
  exp?: number;
}

export const USER_ROLE = {
  admin: "admin",
  worker: "worker",
  office_admin: "office_admin",
} as const;

export type TUserRole = keyof typeof USER_ROLE;

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
  namespace NodeJS {
    interface Global {
      io: SocketIo;
    }
  }
}
