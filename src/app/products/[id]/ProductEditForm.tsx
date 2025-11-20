// src/app/products/[id]/ProductEditForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageUploader } from "../ImageUploader";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrls: unknown;
  createdAt: string | Date;
  lastPostedAt: string | Date | null;
}

interface ProductEditFormProps {
  product: Product;
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const imageUrls = product.imageUrls as string[];
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newImageUrls, setNewImageUrls] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resetImageUploader, setResetImageUploader] = useState(0);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !description) {
      setError("Vui lòng nhập đủ Tên và Mô tả.");
      return;
    }

    setIsLoading(true);

    try {
      const updateData: { name: string; description: string; imageUrls?: string[] } = {
        name,
        description,
      };

      // Nếu có ảnh mới, thêm vào updateData
      if (newImageUrls.length > 0) {
        updateData.imageUrls = newImageUrls;
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Cập nhật sản phẩm thất bại");
      }

      setIsEditing(false);
      setIsEditingImages(false);
      setNewImageUrls([]);
      setResetImageUploader(prev => prev + 1);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(product.name);
    setDescription(product.description);
    setIsEditing(false);
    setIsEditingImages(false);
    setNewImageUrls([]);
    setResetImageUploader(prev => prev + 1);
    setError(null);
  };

  const handleSaveImages = async () => {
    if (newImageUrls.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: product.name,
          description: product.description,
          imageUrls: newImageUrls 
        }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Cập nhật ảnh thất bại");
      }

      setIsEditingImages(false);
      setNewImageUrls([]);
      setResetImageUploader(prev => prev + 1);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Xóa sản phẩm thất bại");
      }

      router.push("/products");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setShowDeleteDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Phần hiển thị ảnh */}
      {imageUrls && imageUrls.length > 0 && (
        <div className="mb-8 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-pink-500/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="bg-linear-to-r from-orange-500 to-pink-600 bg-clip-text text-lg font-bold text-transparent">
              Hình ảnh sản phẩm ({imageUrls.length} ảnh)
            </h3>
            {!isEditingImages && (
              <button
                type="button"
                onClick={() => setIsEditingImages(true)}
                className="flex items-center gap-2 rounded-lg bg-linear-to-r from-orange-500 to-pink-500 px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-pink-500/30 transition hover:shadow-lg hover:scale-105"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Chỉnh sửa ảnh
              </button>
            )}
          </div>
          
          {/* Ảnh chính */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100 mb-4">
            <Image
              src={imageUrls[currentImageIndex]!}
              alt={product.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>

          {/* Thumbnails */}
          {imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                    idx === currentImageIndex
                      ? 'border-orange-500 ring-2 ring-orange-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form chỉnh sửa ảnh */}
      {isEditingImages && (
        <div className="mb-8 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-2xl shadow-pink-500/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="bg-linear-to-r from-orange-500 to-pink-600 bg-clip-text text-lg font-bold text-transparent">Chỉnh sửa hình ảnh</h3>
            <button
              type="button"
              onClick={() => {
                setIsEditingImages(false);
                setNewImageUrls([]);
                setResetImageUploader(prev => prev + 1);
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Hủy
            </button>
          </div>
          <ImageUploader
            key={resetImageUploader}
            initialImages={imageUrls}
            onUploadSuccess={(urls) => setNewImageUrls(urls)}
            onUploadStart={() => setIsLoading(true)}
            onUploadEnd={() => setIsLoading(false)}
            onReset={() => setNewImageUrls([])}
          />
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSaveImages}
              className="w-full rounded-lg bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-pink-500/40 transition hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || newImageUrls.length === 0}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </span>
              ) : newImageUrls.length > 0 ? `Lưu ảnh (${newImageUrls.length} ảnh)` : 'Lưu ảnh'}
            </button>
          </div>
        </div>
      )}

      {/* Form thông tin */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-pink-500/10 backdrop-blur-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="bg-linear-to-r from-orange-500 to-pink-600 bg-clip-text text-2xl font-bold text-transparent">Thông tin sản phẩm</h2>
            <p className="mt-1 text-sm text-gray-600">
              {isEditing ? "Chỉnh sửa thông tin sản phẩm" : "Xem thông tin sản phẩm"}
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 rounded-lg bg-linear-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-pink-500/30 transition hover:shadow-lg hover:scale-105"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Chỉnh sửa
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                disabled={isLoading}
                required
              />
            ) : (
              <p className="text-lg font-medium text-gray-900">{name}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Mô tả <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <textarea
                id="description"
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                disabled={isLoading}
                required
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
            )}
          </div>

          {/* Thông tin metadata */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin khác</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ngày tạo</p>
                <p className="font-medium text-gray-900">
                  {new Date(product.createdAt).toLocaleString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>
              {product.lastPostedAt && (
                <div>
                  <p className="text-gray-500">Cập nhật lần cuối</p>
                  <p className="font-medium text-gray-900">
                    {new Date(product.lastPostedAt).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-pink-500/40 transition hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </span>
              ) : "Lưu thay đổi"}
            </button>
          </div>
        )}

        {/* Nút xóa sản phẩm */}
        {!isEditing && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa sản phẩm
            </button>
          </div>
        )}
      </form>

      {/* Dialog xác nhận xóa */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Xác nhận xóa sản phẩm</h3>
              <p className="mt-2 text-sm text-gray-600">
                Bạn có chắc chắn muốn xóa sản phẩm &ldquo;<strong>{product.name}</strong>&rdquo;? 
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
