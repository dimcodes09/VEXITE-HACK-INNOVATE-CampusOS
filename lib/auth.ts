import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.providerAccountId) {
        return false;
      }

      await connectToDatabase();

      const existingUser = await UserModel.findOne({
        googleId: account.providerAccountId
      }).select("_id");

      if (!existingUser) {
        await UserModel.create({
          googleId: account.providerAccountId,
          email: user.email ?? "",
          name: user.name ?? "",
          image: user.image ?? "",
          createdAt: new Date()
        });
      }

      return true;
    },
    async jwt({ token, account }) {
      if (!account?.providerAccountId) {
        return token;
      }

      await connectToDatabase();

      const mongoUser = await UserModel.findOne({
        googleId: account.providerAccountId
      }).select("_id collegeId");

      if (mongoUser) {
        token.mongoUserId = mongoUser._id.toString();
        token.collegeId = mongoUser.collegeId?.toString() ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.mongoUserId) {
        session.user._id = token.mongoUserId;
        session.user.collegeId = token.collegeId ?? null;
      }

      return session;
    }
  }
};

export class UnauthorizedError extends Error {
  status = 401;

  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function getServerSessionOrThrow(): Promise<Session> {
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    throw new UnauthorizedError();
  }

  return session;
}
