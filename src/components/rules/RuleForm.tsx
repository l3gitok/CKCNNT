// src/app/rules/RuleForm.tsx
"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { RulePreview, RulePreviewPayload } from "~/lib/rules/types";

// Define Product type
interface Product {
  id: string;
  name: string;
  imageUrls: string[];
  description?: string | null;
}

type PreviewResponse = Partial<RulePreview> & { error?: string };

interface RuleFormInitialData {
  id?: string;
  ruleName?: string;
  platform?: string;
  scheduleTime?: string;
  frequency?: string;
  promptTemplate?: string;
  status?: string;
  productIds?: string[];
  preview?: RulePreview | null;
}

interface RuleFormProps {
  initialData?: RuleFormInitialData;
  products?: Product[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RuleForm({ initialData, products = [], onSuccess, onCancel }: RuleFormProps) {
  const router = useRouter();
  const isEditMode = !!initialData?.id;

  // State Form
  const [formData, setFormData] = useState({
    ruleName: initialData?.ruleName ?? "",
    platform: initialData?.platform ?? "FACEBOOK",
    scheduleTime: initialData?.scheduleTime ?? "09:00",
    frequency: initialData?.frequency ?? "DAILY",
    promptTemplate: initialData?.promptTemplate ?? "Viết bài về [PRODUCT_NAME]. Mô tả: [PRODUCT_DESC].",
    status: initialData?.status ?? "ACTIVE",
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(initialData?.productIds ?? []);
  const [productSearch, setProductSearch] = useState("");
  const [previewData, setPreviewData] = useState<RulePreview | null>(initialData?.preview ?? null);
  const [editedPreviewText, setEditedPreviewText] = useState<string>("");
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSelectedProductIds(initialData?.productIds ?? []);
  }, [initialData?.productIds]);

  useEffect(() => {
    setPreviewData(initialData?.preview ?? null);
    setEditedPreviewText(initialData?.preview?.text ?? "");
  }, [initialData?.preview]);

  // State xử lý
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    return products.filter((product) => product.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [products, productSearch]);

  const hasProducts = products.length > 0;

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.back();
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa quy tắc này?");
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/rules/${initialData.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Xóa quy tắc thất bại");
      }
      router.push("/rules");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Không thể xóa quy tắc. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  };

  // Xử lý Test Preview
  const handleTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const previewPayload: RulePreviewPayload = {
        promptTemplate: formData.promptTemplate,
        ruleName: formData.ruleName,
        platform: formData.platform,
        scheduleTime: formData.scheduleTime,
        frequency: formData.frequency,
        status: formData.status,
        productIds: selectedProductIds,
        ruleId: initialData?.id, // Gửi ruleId nếu đang edit để lưu preview vào database
      };

      const res = await fetch("/api/rules/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewPayload),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) throw new Error(data.error ?? "Không thể tạo preview");
      if (!data.text || !data.productName) throw new Error("Preview trả về dữ liệu không hợp lệ");
      const newPreview = {
        text: data.text,
        imageUrl: data.imageUrl ?? "",
        productName: data.productName,
      };
      setPreviewData(newPreview);
      setEditedPreviewText(data.text);
      setIsEditingPreview(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setTesting(false);
    }
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
        preview: previewData
          ? {
              ...previewData,
              text: editedPreviewText || previewData.text,
            }
          : undefined,
      };
      const res = await fetch(initialData ? `/api/rules/${initialData.id}` : "/api/rules", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không thể lưu quy tắc");
      if (onSuccess) {
        onSuccess();
        router.refresh();
      } else {
        router.push("/rules");
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedProducts = products.filter((product) => selectedProductIds.includes(product.id));

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Cột Trái: Form Nhập Liệu */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{isEditMode ? "Chỉnh sửa" : "Tạo mới"}</p>
            <h2 className="text-xl font-semibold text-gray-900">{isEditMode ? "Chỉnh sửa Quy tắc" : "Thêm Quy tắc Mới"}</h2>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{formData.platform}</span>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium">Tên Quy tắc</label>
            <input
              type="text"
              value={formData.ruleName}
              onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
              className="mt-1 w-full rounded-md border p-2"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Nền tảng</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="mt-1 w-full rounded-md border p-2"
              >
                <option value="FACEBOOK">Facebook</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Giờ đăng</label>
              <input
                type="time"
                value={formData.scheduleTime}
                onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                className="mt-1 w-full rounded-md border p-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Chu kỳ</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="mt-1 w-full rounded-md border p-2"
              >
                <option value="DAILY">Hàng ngày</option>
                <option value="WEEKLY">Hàng tuần</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Mẫu Prompt</label>
            <textarea
              rows={6}
              value={formData.promptTemplate}
              onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-sm focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
              placeholder="Dùng [PRODUCT_NAME], [PRODUCT_DESC], [RULE_NAME], [SCHEDULE_TIME]..."
            />
            <p className="mt-2 text-xs text-gray-500">
              <strong>Khung prompt AI marketing cho Facebook Page</strong><br /><br />
              Bạn là một copywriter chuyên nghiệp & giàu sáng tạo đang làm việc cho một thương hiệu bán {'{product_type}'}. Viết cho tôi một bài post Facebook Page gồm 2–3 đoạn ngắn, nội dung hướng tới việc thuyết phục “{'{target_audience}'}” mua {'{product_name}'}. Bài viết cần:<br /><br />
              Giới thiệu lợi ích nổi bật nhất của {'{product_name}'} theo cách gần gũi, dễ hiểu.<br />
              Tạo nhu cầu ngay: nhấn mạnh vấn đề / nhu cầu mà khách hàng đang gặp (pain point / desire).<br />
              Đưa ra lời hứa/giá trị (value proposition) rõ ràng: {'{main_value}'}.<br />
              (Nếu có) Thêm bằng chứng xã hội: đánh giá, số liệu, cảm nhận khách hàng, hay minh hoạ tính hữu dụng.<br />
              Khuyến khích hành động: kêu gọi “Đặt hàng ngay”, “Inbox để được tư vấn”, “Chỉ còn X sản phẩm”, “Ưu đãi nhân dịp …”.<br />
              Tone phù hợp với đối tượng (ví dụ: thân thiện & gần gũi nếu là consumer; chuyên nghiệp & tin cậy nếu B2B).<br />
              Đề xuất hashtag / emoji / CTA ngắn gọn phù hợp post Facebook.<br /><br />
              <strong>Thông tin bạn cần chuẩn bị đầu vào:</strong><br />
              {'{product_name}'} — tên sản phẩm<br />
              {'{product_type}'} — dòng / loại sản phẩm<br />
              {'{target_audience}'} — ai là khách hàng mục tiêu<br />
              {'{main_value}'} — giá trị / lợi ích chính bạn muốn nhấn mạnh (tiện lợi, tiết kiệm, sang – xịn – mịn, giải quyết pain point …)<br />
              (Tuỳ chọn) {'{social_proof}'} — đánh giá / feedback / con số + ưu đãi / giảm giá / thời gian khuyến mãi<br /><br />
              <strong>3 “cơ hội & sự kiện” đáng khai thác marketing hôm nay</strong><br /><br />
              <u>Không khí săn sale cuối tháng + chuẩn bị mùa lễ sắp tới</u><br />
              — Sau đợt khuyến mãi Black Friday/Black November vừa qua, nhiều người đang “cân nhắc mua sắm” thêm — đây là thời điểm tốt để tung ưu đãi gói cuối tháng, hoặc “tăng đơn” trước Giáng sinh.<br /><br />
              <u>Tâm lý “sắm sửa cuối năm – quà tặng & thay đổi phong cách”</u><br />
              — Cuối năm là lúc người ta muốn sắm mới: quà tặng, đồ dùng cá nhân, phụ kiện, làm mới nhà cửa… Nếu sản phẩm của bạn có thể liên kết với nhu cầu này thì dễ kích thích mua.<br /><br />
              <u>Thời điểm “thu nhập ổn định / nhận lương cuối tháng” — tăng chi tiêu tiêu dùng</u><br />
              — Nhiều người nhận lương tháng vào cuối hoặc cuối tuần của tháng. Đây là cơ hội để đưa ra các gói ưu đãi “giá tốt”, khiến khách dễ quyết định mua hơn.<br />
            </p>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Áp dụng cho sản phẩm</p>
                <p className="text-xs text-gray-500">
                  {selectedProductIds.length > 0
                    ? `${selectedProductIds.length} sản phẩm đã chọn`
                    : "Không chọn sản phẩm => dùng ngẫu nhiên toàn bộ thư viện"}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-600">{selectedProductIds.length}</span>
            </div>

            {hasProducts ? (
              <>
                <div className="relative mb-3">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  />
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedProducts.map((product) => (
                      <span
                        key={product.id}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                      >
                        {product.name}
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(product.id)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => {
                      const checked = selectedProductIds.includes(product.id);
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleToggleProduct(product.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition hover:border-purple-300 ${
                            checked ? "border-purple-500 bg-white shadow-sm" : "border-transparent bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.imageUrls.length} hình ảnh</p>
                            </div>
                            <span
                              className={`h-5 w-5 rounded-full border ${
                                checked ? "border-purple-600 bg-purple-600" : "border-gray-300"
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="rounded-md border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
                      Không tìm thấy sản phẩm phù hợp
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                Bạn chưa có sản phẩm nào. Hãy thêm sản phẩm để AI có dữ liệu tạo nội dung.
              </div>
            )}
          </div>

          {/* Nút Test */}
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white py-3 text-sm font-semibold text-purple-600 transition hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50"
          >
            <span>{testing ? "Đang AI xử lý..." : "⚡ Chạy thử (Test Preview)"}</span>
          </button>
        </div>
      </div>

      {/* Cột Phải: Kết quả Preview & Duyệt */}
      <div className="flex flex-col gap-4">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        <div className="flex-1 rounded-2xl border border-gray-100 bg-linear-to-b from-gray-50 to-white p-0 shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Preview thời gian thực</p>
                <h3 className="text-lg font-semibold text-gray-900">Kết quả xem trước</h3>
              </div>
              <span className="text-xs text-gray-500">{previewData ? "Đã tạo" : "Chưa có dữ liệu"}</span>
            </div>
          </div>

          {!previewData ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 text-gray-400">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 6h8m-8 6h8m-8 6h8" />
              </svg>
              <p className="text-sm">Chưa có dữ liệu test. Hãy bấm nút &quot;Chạy thử&quot;.</p>
            </div>
          ) : (
            <div className="space-y-3 px-6 py-5">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                  <div className="h-10 w-10 rounded-full bg-linear-to-br from-purple-500 to-indigo-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Facebook Page</p>
                    <p className="text-xs text-gray-500">Bài đăng trên Page • 🌏</p>
                  </div>
                </div>
                {isEditingPreview ? (
                  <div className="px-4 py-4">
                    <textarea
                      value={editedPreviewText}
                      onChange={(e) => setEditedPreviewText(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
                      placeholder="Nhập nội dung preview..."
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewData({ ...previewData, text: editedPreviewText });
                          setIsEditingPreview(false);
                        }}
                        className="rounded-lg bg-green-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-600"
                      >
                        ✓ Lưu chỉnh sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedPreviewText(previewData.text);
                          setIsEditingPreview(false);
                        }}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative px-4 py-4">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{previewData.text}</div>
                    <button
                      type="button"
                      onClick={() => setIsEditingPreview(true)}
                      className="absolute right-2 top-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 opacity-0 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 group-hover:opacity-100"
                    >
                      ✏️ Chỉnh sửa
                    </button>
                  </div>
                )}
                {previewData.imageUrl && (
                  <Image
                    src={previewData.imageUrl}
                    alt="Preview"
                    width={800}
                    height={400}
                    className="h-64 w-full rounded-b-2xl object-cover"
                  />
                )}
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                Sản phẩm test: <span className="font-medium text-gray-700">{previewData.productName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Nút Duyệt / Lưu / Đăng */}
        <div className="space-y-3">
          {/* Button Xác nhận đăng - chỉ hiển thị khi có preview và đang edit mode */}
          {isEditMode && previewData && (
            <button
              type="button"
              onClick={async () => {
                if (!initialData?.id) return;
                const confirmed = window.confirm("Bạn có chắc chắn muốn đăng bài này lên Facebook Page?");
                if (!confirmed) return;

                setTriggering(true);
                try {
                  const res = await fetch("/api/n8n/trigger", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ruleId: initialData.id,
                      editedPreviewText: editedPreviewText || previewData.text,
                    }),
                  });

                  const data = (await res.json()) as { error?: string; details?: string; success?: boolean; message?: string };

                  if (!res.ok) {
                    const errorMsg = data.error ?? data.details ?? "Không thể trigger n8n";
                    const fullErrorMsg = data.details 
                      ? `${data.error ?? "Lỗi"}: ${data.details}`
                      : errorMsg;
                    
                    console.error("Trigger API error:", {
                      status: res.status,
                      statusText: res.statusText,
                      error: errorMsg,
                      details: data.details,
                    });
                    throw new Error(fullErrorMsg);
                  }

                  alert("✅ Đã trigger n8n thành công!\n\nBài đăng sẽ được xử lý bởi n8n workflow.");
                  router.refresh();
                } catch (error) {
                  console.error("Trigger error:", error);
                  const errorMessage = error instanceof Error ? error.message : "Trigger n8n thất bại. Vui lòng thử lại.";
                  alert(`❌ Lỗi: ${errorMessage}\n\nVui lòng kiểm tra:\n1. n8n workflow đã được activate chưa\n2. Webhook URL đã đúng chưa\n3. Xem console để biết chi tiết lỗi`);
                } finally {
                  setTriggering(false);
                }
              }}
              disabled={triggering || !previewData}
              className="w-full rounded-xl bg-linear-to-r from-purple-500 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {triggering ? "⏳ Đang xử lý..." : "🚀 Xác nhận đăng bài"}
            </button>
          )}

          <div className={`grid gap-3 ${isEditMode ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 disabled:opacity-50"
              >
                {deleting ? "Đang xóa..." : "🗑 Xóa quy tắc"}
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition hover:border-gray-300"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-linear-to-r from-green-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : isEditMode ? "Cập nhật Quy tắc" : "✅ Duyệt & Lưu Quy tắc"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}