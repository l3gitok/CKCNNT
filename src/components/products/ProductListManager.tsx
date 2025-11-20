"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductForm } from "./ProductForm";

interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrls: string[];
  lastPostedAt: Date | null;
}

interface ProductListManagerProps {
  products: Product[];
}

export function ProductListManager({ products }: ProductListManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header Actions */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Danh sách sản phẩm</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {filteredProducts.length}
          </span>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 sm:w-64"
            />
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 ${
              isAdding
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-linear-to-r from-orange-500 to-pink-600 hover:shadow-pink-500/40"
            }`}
          >
            {isAdding ? (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Hủy bỏ
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm sản phẩm
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Form Section */}
      {isAdding && (
        <div className="animate-scaleIn mb-10">
          <div className="mx-auto max-w-3xl">
            <ProductForm onSuccess={() => setIsAdding(false)} />
          </div>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-16 backdrop-blur-sm">
          <div className="mb-4 rounded-2xl bg-linear-to-br from-orange-100 to-pink-100 p-6">
            <svg className="h-16 w-16 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900">Chưa có sản phẩm nào</p>
          <p className="mt-2 text-sm text-gray-600">Hãy thêm sản phẩm đầu tiên của bạn!</p>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="mt-6 rounded-lg bg-orange-500 px-6 py-2 font-medium text-white transition hover:bg-orange-600"
            >
              Thêm ngay
            </button>
          )}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-12">
          <div className="mb-3 rounded-full bg-gray-100 p-3">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-900 font-medium">Không tìm thấy sản phẩm nào</p>
          <p className="text-sm text-gray-500">Thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Sản phẩm
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Mô tả
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cập nhật cuối
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="group transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <Image
                            src={product.imageUrls[0]!}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-orange-600">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {product.imageUrls.length} hình ảnh
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="line-clamp-2 max-w-xs text-sm text-gray-600">
                      {product.description}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {product.lastPostedAt ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {new Date(product.lastPostedAt).toLocaleDateString('vi-VN')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Chưa đăng
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/products/${product.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
