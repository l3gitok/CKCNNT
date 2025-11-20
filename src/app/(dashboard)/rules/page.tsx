import { auth } from "~/server/auth";
import { db } from "~/server/db";
import Link from "next/link";
import { RuleListManager } from "~/components/rules/RuleListManager";

export const metadata = {
  title: "Quản lý Quy tắc - Auto Marketing",
  description: "Tạo và quản lý lịch đăng bài tự động cho sản phẩm",
};

export default async function RulesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để xem trang này.</p>
        <Link href="/" className="text-blue-600">Quay về trang chủ</Link>
      </main>
    );
  }

  // 1. Lấy danh sách quy tắc từ DB (Server Component)
  const rules = await db.autoPostRule.findMany({
    where: { userId: session.user.id },
    orderBy: { ruleName: "asc" },
    include: {
      products: {
        select: {
          name: true,
        },
      },
    },
  });

  // 2. Lấy danh sách sản phẩm để chọn trong form
  const products = await db.product.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, imageUrls: true },
    orderBy: { name: "asc" },
  });

  // Transform rules to match the interface expected by RuleListManager
  const formattedRules = rules.map((rule) => {
    const r = rule as unknown as {
      id: string;
      ruleName: string;
      platform: string;
      scheduleTime: string;
      frequency: string;
      status: string;
      products: { name: string }[];
    };

    return {
      id: r.id,
      name: r.ruleName,
      platform: r.platform,
      schedule: r.scheduleTime,
      frequency: r.frequency,
      isActive: r.status === 'ACTIVE',
      products: r.products,
    };
  });

  // 3. Render UI
  return (
    <>
      {/* Title Section */}
      <div className="animate-fadeInUp mb-10 text-center">
        <div className="mb-3 flex justify-center">
          <div className="rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-blue-500/40">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 bg-linear-to-r from-cyan-500 to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent">
          Quy tắc Tự động
        </h1>
        <p className="text-gray-600">Tạo và quản lý lịch đăng bài tự động cho sản phẩm</p>
      </div>

      <div className="animate-fadeInUp">
        <RuleListManager initialRules={formattedRules} products={products} />
      </div>
    </>
  );
}
