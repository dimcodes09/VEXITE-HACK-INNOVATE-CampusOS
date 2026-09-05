import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      _id: string;
      collegeId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    mongoUserId?: string;
    collegeId?: string | null;
  }
}
