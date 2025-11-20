// src/app/products/ProductForm.tsx
"use client"; 
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "./ImageUploader"; 

export function ProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetUploader, setResetUploader] = useState(0);

  const router = useRouter(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !description || imageUrls.length === 0) {
      setError("Vui lòng nhập đủ Tên, Mô tả và ít nhất 1 Hình ảnh.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Đang gửi dữ liệu:", { name, description, imageUrls });
      
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, imageUrls }),
      });

      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        console.error("Lỗi từ server:", errData);
        throw new Error(errData.error ?? "Tạo sản phẩm thất bại");
      }

      const result = await res.json() as { id: string; name: string };
      console.log("Sản phẩm đã tạo:", result);

      setName("");
      setDescription("");
      setImageUrls([]);
      setResetUploader(prev => prev + 1); // Trigger reset ImageUploader
      router.refresh(); // Tải lại danh sách sản phẩm
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error("Lỗi khi submit:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-pink-500/10 backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="bg-linear-to-r from-orange-500 to-pink-600 bg-clip-text text-2xl font-bold text-transparent">Thêm sản phẩm mới</h2>
        <p className="mt-1 text-sm text-gray-600">Điền thông tin sản phẩm để bắt đầu tự động hóa</p>
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
        <ImageUploader 
          key={resetUploader}
          onUploadSuccess={(urls) => setImageUrls(urls)} 
          onUploadStart={() => setIsLoading(true)}
          onUploadEnd={() => setIsLoading(false)}
          onReset={() => setImageUrls([])}
        />

        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Ví dụ: iPhone 15 Pro Max"
            disabled={isLoading}
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="Mô tả chi tiết về sản phẩm, tính năng nổi bật..."
            disabled={isLoading}
            required
          />
        </div>
      </div>
      
      <div className="mt-6 flex gap-3">
        <button 
          type="submit" 
          className="flex-1 rounded-lg bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-pink-500/40 transition hover:shadow-xl hover:shadow-pink-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || imageUrls.length === 0}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </span>
          ) : "Lưu sản phẩm"}
        </button>
      </div>
    </form>
  );
}
