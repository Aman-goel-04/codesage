import { prisma } from "@repo/db";
import type { Request } from "express";

export async function getUserFromRequest(req: Request) {
  const token = req.cookies.session;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  return session?.user || null;
}