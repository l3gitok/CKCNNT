// src/app/products/page.tsx
import { auth } from "~/server/auth"; // Import hàm auth
import { db } from "~/server/db";
import Link from "next/link";
import { ProductListManager } from "~/components/products/ProductListManager";

export const metadata = {
  title: "Quản lý Sản phẩm - Auto Marketing",
  description: "Thêm và quản lý sản phẩm để tự động tạo bài đăng",
};

export default async function ProductsPage() {
  const session = await auth(); // Lấy session

  if (!session?.user?.id) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để xem trang này.</p>
        <Link href="/" className="text-blue-600">Quay về trang chủ</Link>
      </main>
    );
  }

  // 1. Lấy danh sách sản phẩm từ DB (Server Component)
  const products = await db.product.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });

  // 2. Render
  return (
    <>
      {/* Title Section */}
      <div className="animate-fadeInUp mb-8 flex flex-col items-center justify-center text-center">
        <div className="mb-3">
          <div className="rounded-2xl bg-linear-to-br from-orange-500 to-pink-600 p-3 shadow-lg shadow-pink-500/40">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 bg-linear-to-r from-orange-500 to-pink-600 bg-clip-text text-4xl font-extrabold text-transparent">
          Quản lý Sản phẩm
        </h1>
        <p className="text-gray-600">Thêm và quản lý sản phẩm để tự động tạo bài đăng</p>
      </div>
    
      {/* Product List Manager (List + Add Form) */}
      <div className="animate-fadeInUp">
        <ProductListManager products={products} />
      </div>
    </>
  );
}
