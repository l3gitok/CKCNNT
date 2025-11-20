/* eslint-disable @next/next/no-img-element */
// src/app/rules/RuleForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  imageUrls: string[];
}

interface RuleFormProps {
  products: Product[];
  onSuccess?: () => void;
}

export function RuleForm({ products, onSuccess }: RuleFormProps) {
  const [ruleName, setRuleName] = useState("");
  const [platform, setPlatform] = useState("FACEBOOK");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [frequency, setFrequency] = useState("DAILY");
  const [promptTemplate, setPromptTemplate] = useState(
    "Viết một bài đăng Facebook về sản phẩm [PRODUCT_NAME]. Mô tả: [PRODUCT_DESC]. Phong cách: Vui vẻ."
  );
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
    !selectedProducts.some(sp => sp.id === p.id)
  );

  const handleSelectProduct = (product: Product) => {
    setSelectedProducts([...selectedProducts, product]);
    setProductSearch("");
    setIsSearching(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Gọi API route bạn vừa tạo
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleName,
          platform,
          scheduleTime,
          frequency,
          promptTemplate,
          productIds: selectedProducts.map(p => p.id), // Gửi danh sách productId
        }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Tạo quy tắc thất bại");
      }

      // Xóa form và refresh
      setRuleName("");
      setSelectedProducts([]);
      setProductSearch("");
      // (Bạn có thể reset các trường khác nếu muốn)
      router.refresh(); // Tải lại danh sách quy tắc
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tạo Quy tắc Đăng bài Tự động</h2>
        <p className="mt-1 text-sm text-gray-600">Thiết lập lịch trình đăng bài tự động cho sản phẩm</p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 shrink-0 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="ruleName" className="block text-sm font-semibold text-gray-700 mb-2">
            Tên Quy tắc <span className="text-red-500">*</span>
          </label>
          <input
            id="ruleName"
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Ví dụ: Đăng sản phẩm mỗi sáng"
            required
          />
        </div>

        {/* Product Selection */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Sản phẩm áp dụng (Tùy chọn)
          </label>
          
          {/* Selected Products List */}
          {selectedProducts.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedProducts.map(product => (
                <div key={product.id} className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5">
                  {product.imageUrls && product.imageUrls.length > 0 && (
                    <img 
                      src={product.imageUrls[0]} 
                      alt={product.name} 
                      className="h-5 w-5 rounded object-cover"
                    />
                  )}
                  <span className="text-sm font-medium text-blue-900">{product.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.id)}
                    className="ml-1 rounded-full p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-600"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Tìm kiếm và thêm sản phẩm..."
            />
            {isSearching && productSearch && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredProducts.length > 0 ? (
                  <ul className="py-1">
                    {filteredProducts.map((product) => (
                      <li
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <img 
                            src={product.imageUrls[0]} 
                            alt={product.name} 
                            className="h-10 w-10 rounded object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100 text-gray-400">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy sản phẩm</div>
                )}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">Để trống để áp dụng cho tất cả sản phẩm hoặc chọn ngẫu nhiên.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="platform" className="block text-sm font-semibold text-gray-700 mb-2">Nền tảng</label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="FACEBOOK">📘 Facebook</option>
              <option value="EMAIL">📧 Email</option>
            </select>
          </div>
          <div>
            <label htmlFor="frequency" className="block text-sm font-semibold text-gray-700 mb-2">Tần suất</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="DAILY">📅 Hàng ngày</option>
              <option value="WEEKLY">📆 Hàng tuần</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="scheduleTime" className="block text-sm font-semibold text-gray-700 mb-2">
            Thời gian đăng <span className="text-red-500">*</span>
          </label>
          <input
            id="scheduleTime"
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>

        <div>
          <label htmlFor="promptTemplate" className="block text-sm font-semibold text-gray-700 mb-2">
            Mẫu Prompt (Câu lệnh AI) <span className="text-red-500">*</span>
          </label>
          <textarea
            id="promptTemplate"
            rows={5}
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
          <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> Sử dụng <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono">[PRODUCT_NAME]</code> và <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono">[PRODUCT_DESC]</code> để tự động chèn thông tin sản phẩm.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="w-full rounded-lg bg-linear-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:from-purple-700 hover:to-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          ) : "⚡ Lưu Quy tắc"}
        </button>
      </div>
    </form>
  );
}
