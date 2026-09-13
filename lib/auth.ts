import { auth } from "@clerk/nextjs/server";

export async function isBigDave(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const bigDaveId = process.env.BIGDAVE_USER_ID;
  if (!bigDaveId) {
    // If no specific user ID is configured, any authenticated user is BigDave
    return true;
  }

  return userId === bigDaveId;
}

export async function requireBigDave(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: Not authenticated");
  }

  const bigDaveId = process.env.BIGDAVE_USER_ID;
  if (bigDaveId && userId !== bigDaveId) {
    throw new Error("Unauthorized: Not BigDave");
  }

  return userId;
}
