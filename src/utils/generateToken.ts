// npm i jsonwebtoken
// npm i @types/jsonwebtoken

import jwt from "jsonwebtoken";
import { JWTPayload } from "./types";

export function generateJWT(jwtPayload: JWTPayload): string {
  const privateKey = process.env.JWT_SECRET as string;

  const token = jwt.sign(jwtPayload, privateKey, {
    expiresIn: "1d",
  });

  return token;
}
