"use client";

import { useState } from "react";
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
  isActive: boolean;
  products: {
    name: string;
  }[];
}

interface RuleListManagerProps {
  initialRules: Rule[];
  products: Product[];
}

export function RuleListManager({ initialRules, products }: RuleListManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRules = initialRules.filter((rule) =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Thêm Quy tắc
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <RuleForm products={products} onSuccess={() => setIsAdding(false)} />
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
                          {rule.products.map((p, idx) => (
                            <span key={idx} className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
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
                    <td className="px-6 py-4 text-right">
                      <button className="font-medium text-blue-600 hover:underline">Sửa</button>
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