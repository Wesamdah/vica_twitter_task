import { JWTPayload } from "@/utils/types";
import { verifyToken } from "@/utils/verifyToken";
import { NextRequest } from "next/server";

// @param req : The incoming request object
// @param allowedRoles : An array of roles allowed to access the resource
// @return :A promise resolving to the deocde JWT Payload if authorized, or null

export async function authenticateAndAuthorize(
  request: NextRequest,
  allowedRoles: number[]
): Promise<JWTPayload | null> {
  // middleware always retun null or sonething
  try {
    const token = request.cookies.get("jwtToken")?.value;

    if (!token) {
      console.error("NO JWT Token found in cookies");
      return null;
    }

    const userPayload = verifyToken(token);

    if (!userPayload) {
      console.error("Invalid or expired token");
      return null;
    }

    console.log("Decoded Payload", userPayload);

    if (!allowedRoles.includes(userPayload.role_id)) {
      console.log("Forbidden : User role is not authorized", {
        userRloe: userPayload.role_id,
        allowedRoles,
      });
      return null;
    }

    return userPayload;
  } catch (error) {
    console.error("error in authenticateAndAuthorizeMidlleweare", error);
    return null;
  }
}
