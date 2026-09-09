import { cookies, headers } from "next/headers";
import { AUTH_HEADER } from "@/lib/auth/constants";

export async function isAuthenticatedRequest() {
  const authHeader = (await headers()).get(AUTH_HEADER);
  if (authHeader === "1") return true;
  if (authHeader === "0") return false;

  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some(
      (cookie) => cookie.name.includes("-auth-token") && Boolean(cookie.value),
    );
}
