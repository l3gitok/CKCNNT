"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RuleForm } from "./RuleForm";

interface Product {
  id: string;
  name: string;
  imageUrls: string[];
}

interface Rule {
  id: string;
  name: string;
  platform: string;
  schedule: string;
  frequency: string;
  status: string;
  isActive: boolean;
  products: {
    id: string;
    name: string;
  }[];
}

interface RuleListManagerProps {
  initialRules: Rule[];
  products?: Product[];
}

export function RuleListManager({ initialRules, products = [] }: RuleListManagerProps) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [triggeringRuleId, setTriggeringRuleId] = useState<string | null>(null);

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);

  const filteredRules = rules.filter((rule) =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện click vào row
    const newStatus = !currentStatus;

    // Optimistic UI update
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: newStatus, status: newStatus ? "ACTIVE" : "INACTIVE" } : r)));

    try {
      await fetch(`/api/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus ? "ACTIVE" : "INACTIVE" }),
      });
      router.refresh();
    } catch {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: currentStatus, status: currentStatus ? "ACTIVE" : "INACTIVE" } : r)));
      alert("Lỗi cập nhật trạng thái");
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa quy tắc "${name}"?`);
    if (!confirmed) return;

    const previousRules = rules;
    setRules((prev) => prev.filter((rule) => rule.id !== id));

    try {
      const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xóa quy tắc");
      router.refresh();
    } catch (error) {
      console.error(error);
      setRules(previousRules);
      alert("Xóa quy tắc thất bại. Vui lòng thử lại.");
    }
  };

  const handleTrigger = async (id: string, name: string, isActive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isActive) {
      alert("Vui lòng kích hoạt quy tắc trước khi đăng bài");
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc chắn muốn đăng bài ngay với quy tắc "${name}"?`);
    if (!confirmed) return;

    setTriggeringRuleId(id);

    try {
      const res = await fetch("/api/n8n/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || data.details || "Không thể trigger n8n";
        // Hiển thị lỗi với format dễ đọc hơn (xử lý \n thành line breaks)
        const formattedError = errorMsg.replace(/\\n/g, "\n");
        throw new Error(formattedError);
      }

      alert("✅ Đã trigger n8n webhook thành công!\n\nBài đăng sẽ được xử lý bởi n8n workflow.");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Trigger n8n thất bại. Vui lòng thử lại.";
      // Hiển thị alert với message có thể có nhiều dòng
      alert(errorMessage);
    } finally {
      setTriggeringRuleId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm quy tắc..."
            className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
            isAdding
              ? "bg-red-500 hover:bg-red-600"
              : "bg-purple-600 hover:bg-purple-700"
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
              Tạo Quy tắc mới
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <RuleForm
            products={products}
            onCancel={() => setIsAdding(false)}
            onSuccess={() => {
              setIsAdding(false);
              router.refresh();
            }}
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-6 py-3">Tên Quy tắc</th>
                <th className="px-6 py-3">Sản phẩm</th>
                <th className="px-6 py-3">Nền tảng</th>
                <th className="px-6 py-3">Lịch trình</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRules.length > 0 ? (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{rule.name}</td>
                    <td className="px-6 py-4">
                      {rule.products && rule.products.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rule.products.map((p) => (
                            <span key={p.id} className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Tất cả / Ngẫu nhiên</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        rule.platform === 'FACEBOOK' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {rule.platform === 'FACEBOOK' ? '📘 Facebook' : '📧 Email'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{rule.schedule}</span>
                        <span className="text-xs text-gray-500">{rule.frequency === 'DAILY' ? 'Hàng ngày' : 'Hàng tuần'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        rule.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.isActive ? 'Đang chạy' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {rule.isActive && (
                          <button
                            onClick={(e) => handleTrigger(rule.id, rule.name, rule.isActive, e)}
                            disabled={triggeringRuleId === rule.id}
                            className="group flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-600 transition-all hover:border-purple-300 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Đăng bài ngay"
                          >
                            {triggeringRuleId === rule.id ? (
                              <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Đang xử lý...</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Đăng ngay</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={(e) => handleToggle(rule.id, rule.isActive, e)}
                          className={`group flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                            rule.isActive
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                          title={rule.isActive ? "Tạm dừng quy tắc" : "Kích hoạt quy tắc"}
                        >
                          {rule.isActive ? (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Tạm dừng</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Kích hoạt</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => router.push(`/rules/${rule.id}/edit`)}
                          className="group flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition-all hover:border-blue-300 hover:bg-blue-100"
                          title="Chỉnh sửa quy tắc"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Sửa</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(rule.id, rule.name, e)}
                          className="group flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100"
                          title="Xóa quy tắc"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? "Không tìm thấy quy tắc nào phù hợp" : "Chưa có quy tắc nào được tạo"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}