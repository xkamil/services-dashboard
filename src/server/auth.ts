import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

import { env } from "~/env";

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  isTemporaryPassword: boolean;
}

export const sessionOptions = {
  password: env.SESSION_SECRET,
  cookieName: "app-session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
