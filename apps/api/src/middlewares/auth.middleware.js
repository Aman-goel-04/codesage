import { prisma } from "@repo/db";
export async function getUserFromRequest(req) {
    const token = req.cookies.session;
    if (!token)
        return null;
    const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
    });
    return session?.user || null;
}
//# sourceMappingURL=auth.middleware.js.map