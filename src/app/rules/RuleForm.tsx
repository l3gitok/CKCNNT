// src/app/rules/RuleForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RuleForm() {
  const [ruleName, setRuleName] = useState("");
  const [platform, setPlatform] = useState("FACEBOOK");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [frequency, setFrequency] = useState("DAILY");
  const [promptTemplate, setPromptTemplate] = useState(
    "Viết một bài đăng Facebook về sản phẩm [PRODUCT_NAME]. Mô tả: [PRODUCT_DESC]. Phong cách: Vui vẻ."
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
        }),
      });

      if (!res.ok) {
        const errData = await res.json() as { error?: string };
        throw new Error(errData.error ?? "Tạo quy tắc thất bại");
      }

      // Xóa form và refresh
      setRuleName("");
      // (Bạn có thể reset các trường khác nếu muốn)
      router.refresh(); // Tải lại danh sách quy tắc

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
          <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:from-purple-700 hover:to-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
