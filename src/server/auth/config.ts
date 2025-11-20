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
            "pages_show_list",       // Quyền xem danh sách Page
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

   
    // Callback này được gọi khi token được tạo (lúc đăng nhập)
    async jwt({ token, account, user }) {
      
      // Chỉ chạy khi người dùng đăng nhập (hoặc đăng nhập lại) bằng Facebook
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

            // 4. Lưu vào Database (n8n sẽ dùng cái này sau)
            // 'user' object có sẵn khi đăng nhập lần đầu
            if (user && pageAccessToken && pageId) {
              await db.user.update({
                where: { id: user.id },
                data: {
                  // TODO: Bạn nên mã hóa token này trước khi lưu!
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
      
      // Trả về token để NextAuth tiếp tục
      return token;
    },

  },
} satisfies NextAuthConfig;