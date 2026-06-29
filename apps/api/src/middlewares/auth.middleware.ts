import { prisma } from "@repo/db";
import type { Request } from "express";

export async function getUserFromRequest(req: Request) {
  console.log("Cookies:", req.cookies);
  const token = req.cookies.session;
  console.log("Session token:", token);

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  console.log("Session:", session);

  return session?.user || null;
}