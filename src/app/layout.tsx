import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Auto Marketing",
  description: "Hệ thống quản lý sản phẩm và đăng bài tự động",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
  ],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
