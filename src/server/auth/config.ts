import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import { db } from "~/server/db";

// Types cho Facebook Graph API
interface FacebookPage {
  id: string;
  access_token: string;
  name?: string;
}

interface FacebookPagesResponse {
  data?: FacebookPage[];
}

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js
 */
export const authConfig = {
  providers: [

   
    FacebookProvider({
      // Lấy ID và Secret từ file .env
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      // Yêu cầu các quyền (scope) cần thiết
      authorization: {
        params: {
          scope: [
            "email",
            "public_profile",
            "pages_manage_posts",    // Quyền đăng bài
            "pages_read_engagement", // Quyền đọc tương tác
            "pages_show_list",
            "read_insights",
            "business_management",
            "pages_manage_metadata",
            "pages_read_user_content",
            "pages_manage_engagement",     
          ].join(" "),
        },
      },
    }),

  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    // Callback này giữ nguyên, dùng để thêm 'id' vào session
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  events: {
    // Sự kiện này chạy bất đồng bộ sau khi đăng nhập thành công
    async signIn({ user, account }) {
      // Chỉ chạy khi người dùng đăng nhập bằng Facebook
      if (account?.provider === "facebook") {
        try {
          // 1. Lấy User Access Token (ngắn hạn)
          const userAccessToken = account.access_token;

          // 2. Gọi Graph API để lấy danh sách Page
          const pagesRes = await fetch(
            `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
          );
          const pagesData = await pagesRes.json() as FacebookPagesResponse;

          if (pagesData.data && pagesData.data.length > 0) {
            // 3. Lấy Page Token & Page ID (của trang đầu tiên)
            const firstPage = pagesData.data[0];
            const pageAccessToken = firstPage?.access_token;
            const pageId = firstPage?.id;

            // 4. Lưu vào Database
            if (user.id && pageAccessToken && pageId) {
              await db.user.update({
                where: { id: user.id },
                data: {
                  encryptedPageToken: pageAccessToken,
                  pageId: pageId,
                },
              });
            }
          }
        } catch (error) {
          console.error("Lỗi khi lấy Page Access Token:", error);
        }
      }
    },
  },
} satisfies NextAuthConfig;