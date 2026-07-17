import jwt from "jsonwebtoken";
import type { SafeUser } from "@workspace/db";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production-please";
const JWT_EXPIRES_IN = "7d";
const COOKIE_NAME = "auth_token";
const IS_PROD = process.env.NODE_ENV === "production";

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  hotelId: number | null;
  name: string;
}

export function signToken(user: SafeUser): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    hotelId: user.hotelId ?? null,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export { COOKIE_NAME, IS_PROD };

export function setCookieOptions() {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: (IS_PROD ? "strict" : "lax") as "strict" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/",
  };
}
