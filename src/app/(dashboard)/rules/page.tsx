import Link from "next/link";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { RuleListManager } from "~/components/rules/RuleListManager"; // Component mới cho danh sách

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
        <Link href="/" className="text-blue-600">
          Quay về trang chủ
        </Link>
      </main>
    );
  }

  let rules: Array<{
    id: string;
    ruleName: string;
    platform: string;
    scheduleTime: string;
    frequency: string;
    status: string;
    products: Array<{ id: string; name: string }>;
  }> = [];
  let products: Array<{
    id: string;
    name: string;
    imageUrls: string[];
    description: string;
  }> = [];

  try {
    [rules, products] = await Promise.all([
      db.autoPostRule.findMany({
        where: { userId: session.user.id },
        orderBy: { ruleName: "asc" },
        include: {
          products: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.product.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          imageUrls: true,
          description: true,
        },
      }),
    ]);
  } catch (error) {
    console.error("Database connection error:", error);
    // Trả về empty arrays nếu không kết nối được database
    // UI sẽ hiển thị "Chưa có quy tắc nào" thay vì crash
  }

  const formattedRules = rules.map((rule) => ({
    id: rule.id,
    name: rule.ruleName,
    platform: rule.platform,
    schedule: rule.scheduleTime,
    frequency: rule.frequency,
    status: rule.status,
    isActive: rule.status === "ACTIVE",
    products: rule.products?.map((product) => ({ id: product.id, name: product.name })) || [],
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quản lý Quy tắc</h1>
        <p className="mt-1 text-sm text-gray-500">Tạo, chỉnh sửa và tối ưu lịch đăng của bạn.</p>
      </div>

      {/* Tách logic list ra component client để xử lý toggle */}
      <RuleListManager initialRules={formattedRules} products={products} />
    </div>
  );
}
