// src/app/products/page.tsx
import { auth } from "~/server/auth"; // Import hàm auth
import { db } from "~/server/db";
import { ProductForm } from "./ProductForm"; 
import Link from "next/link";
import Image from "next/image";

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
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Subtle animated background */}
      <div className="animate-gradient absolute inset-0 bg-linear-to-br from-orange-100/30 via-pink-100/20 to-purple-100/30 opacity-60" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="animate-slideInRight mb-8">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white/80 hover:text-blue-600 hover:shadow-md"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Trang chủ
          </Link>
        </div>

        {/* Title Section */}
        <div className="animate-fadeInUp mb-10 flex flex-col items-center justify-center text-center">
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
      
        {/* Form thêm sản phẩm */}
        <div className="animate-scaleIn mb-12 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <ProductForm />
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="animate-fadeInUp mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Sản phẩm của bạn</h2>
            <div className="flex items-center gap-2 rounded-full bg-linear-to-r from-orange-500 to-pink-500 px-4 py-2 shadow-lg shadow-pink-500/40">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-sm font-semibold text-white">
                {products.length} sản phẩm
              </span>
            </div>
          </div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-16 backdrop-blur-sm">
              <div className="mb-4 rounded-2xl bg-linear-to-br from-orange-100 to-pink-100 p-6">
                <svg className="h-16 w-16 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900">Chưa có sản phẩm nào</p>
              <p className="mt-2 text-sm text-gray-600">Hãy thêm sản phẩm đầu tiên của bạn ở form bên trên!</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const imageUrls = product.imageUrls;
                return (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id} 
                  className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 block"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-linear-to-br from-orange-500/0 to-pink-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
                  
                  {imageUrls && imageUrls.length > 0 && (
                    <div className="relative h-56 w-full overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
                      <Image 
                        src={imageUrls[0]!} 
                        alt={product.name} 
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      {imageUrls.length > 1 && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-white backdrop-blur-sm">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs font-semibold">+{imageUrls.length - 1}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative p-6">
                    <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-orange-600">{product.name}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600">{product.description}</p>
                    {product.lastPostedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="rounded-full bg-orange-100 p-1">
                          <svg className="h-3 w-3 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-medium">Cập nhật: {new Date(product.lastPostedAt).toLocaleDateString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
