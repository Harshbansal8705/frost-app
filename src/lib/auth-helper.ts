import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FrostError, FrostSession } from "@/types";

/**
 * Retrieves the current authenticated user session.
 * For Server Components: Redirects to /auth/signin if not authenticated.
 * For API Routes: Redirects to /auth/signin (307). 
 * NOTE: API clients fetch/axios will follow this redirect and receive HTML. 
 * If you need a 401 JSON response, check session manually in the route.
 */
export async function authenticateUser(): Promise<FrostSession> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new FrostError("Unauthorized", 401);
  }

  return session as FrostSession;
}
