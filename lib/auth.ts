import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { CollegeModel } from "@/models/College";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/",
    error: "/"
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.providerAccountId) {
        return false;
      }

      await connectToDatabase();

      const existingUser = await UserModel.findOne({
        $or: [
          { googleId: account.providerAccountId },
          ...(user.email ? [{ email: user.email }] : [])
        ]
      });

      const defaultCollege = await CollegeModel.findOne().select("_id");

      if (!existingUser) {
        await UserModel.create({
          googleId: account.providerAccountId,
          email: user.email ?? "",
          name: user.name ?? "",
          image: user.image ?? "",
          collegeId: defaultCollege?._id ?? null,
          createdAt: new Date()
        });
      } else {
        const updates: Record<string, any> = {};
        if (existingUser.googleId !== account.providerAccountId) {
          updates.googleId = account.providerAccountId;
        }
        if (!existingUser.collegeId && defaultCollege) {
          updates.collegeId = defaultCollege._id;
        }
        if (user.name && existingUser.name !== user.name) {
          updates.name = user.name;
        }
        if (user.image && existingUser.image !== user.image) {
          updates.image = user.image;
        }

        if (Object.keys(updates).length > 0) {
          await UserModel.updateOne({ _id: existingUser._id }, { $set: updates });
        }
      }

      return true;
    },
    async jwt({ token, account, user }) {
      if (account?.providerAccountId || user?.email || token?.email) {
        await connectToDatabase();

        const mongoUser = await UserModel.findOne({
          $or: [
            ...(account?.providerAccountId ? [{ googleId: account.providerAccountId }] : []),
            ...(user?.email ? [{ email: user.email }] : []),
            ...(token?.email ? [{ email: token.email }] : [])
          ]
        }).select("_id collegeId");

        if (mongoUser) {
          if (!mongoUser.collegeId) {
            const defaultCollege = await CollegeModel.findOne().select("_id");
            if (defaultCollege) {
              mongoUser.collegeId = defaultCollege._id;
              await UserModel.updateOne(
                { _id: mongoUser._id },
                { $set: { collegeId: defaultCollege._id } }
              );
            }
          }
          token.mongoUserId = mongoUser._id.toString();
          token.collegeId = mongoUser.collegeId?.toString() ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.mongoUserId) {
        session.user._id = token.mongoUserId;
        session.user.collegeId = token.collegeId ?? null;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      try {
        const urlOrigin = new URL(url).origin;
        const baseOrigin = new URL(baseUrl).origin;
        if (urlOrigin === baseOrigin) return url;
      } catch {
        // invalid URL format, fallback to base
      }
      return baseUrl;
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
