import Link from "next/link";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { RuleForm } from "~/components/rules/RuleForm";

export default async function NewRulePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để tạo quy tắc.</p>
        <Link href="/" className="text-blue-600">
          Quay về trang chủ
        </Link> 
      </main>
    );
  }

  let products: Array<{
    id: string;
    name: string;
    imageUrls: string[];
    description?: string | null;
  }> = [];

  try {
    products = await db.product.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        imageUrls: true,
        description: true,
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    // products sẽ là empty array, UI sẽ hiển thị "Bạn chưa có sản phẩm nào"
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Thêm Quy tắc Mới</h1>
      <RuleForm products={products} />
    </div>
  );
}