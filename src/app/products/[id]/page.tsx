// src/app/products/[id]/page.tsx
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ProductEditForm } from "./ProductEditForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Chi tiết sản phẩm - Auto Marketing",
  description: "Xem và chỉnh sửa thông tin sản phẩm trong hệ thống Auto Marketing",
};

export default async function ProductDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  // Kiểm tra quyền sở hữu
  if (product.userId !== session.user.id) {
    redirect("/products");
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-blue-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay về Danh sách sản phẩm
          </Link>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chi tiết sản phẩm</h1>
          <p className="text-gray-600">Xem và chỉnh sửa thông tin sản phẩm</p>
        </div>

        {/* Form chỉnh sửa */}
        <ProductEditForm product={product} />
      </div>
    </main>
  );
}
