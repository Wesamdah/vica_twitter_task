import jwt from "jsonwebtoken";
import { JWTPayload } from "./types";

export function verifyToken(token: string | null): JWTPayload | null {
  try {
    if (!token) return null;

    const privateKey = process.env.JWT_SECRET as string;
    const userPayload = jwt.verify(token, privateKey) as JWTPayload;

    return userPayload;
  } catch (error) {
    return null;
  }
}
