import type { Request } from "express";
export declare function getUserFromRequest(req: Request): Promise<{
    id: string;
    createdAt: Date;
    name: string | null;
    githubId: string;
    email: string | null;
    gh_access_token: string | null;
    updatedAt: Date;
} | null>;
//# sourceMappingURL=auth.middleware.d.ts.map