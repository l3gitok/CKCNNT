"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RuleStatsChart } from "./RuleStatsChart";

interface Rule {
  id: string;
  ruleName: string;
  platform: string;
}

interface Post {
  id: string;
  postUrl: string | null;
  pageId: string | null;
  pageName: string | null;
  views: number;
  interactions: number;
  shares: number;
  comments: number;
  createdAt: Date;
  rule: Rule;
}

interface PostListManagerProps {
  initialPosts: Post[];
  rules: Rule[];
  userPageName?: string | null;
  userPageId?: string | null; // Added userPageId to the interface
}

export function PostListManager({ initialPosts, rules, userPageName }: PostListManagerProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Tính số bài đăng cho mỗi quy tắc
  const rulesWithPostCount = useMemo(() => {
    return rules.map((rule) => {
      const postCount = posts.filter((post) => post.rule.id === rule.id).length;
      const rulePosts = posts.filter((post) => post.rule.id === rule.id);
      const totalStats = rulePosts.reduce(
        (acc, post) => ({
          views: acc.views + post.views,
          interactions: acc.interactions + post.interactions,
          shares: acc.shares + post.shares,
          comments: acc.comments + post.comments,
        }),
        { views: 0, interactions: 0, shares: 0, comments: 0 }
      );

      return {
        ...rule,
        postCount,
        totalStats,
        posts: rulePosts,
      };
    });
  }, [rules, posts]);

  const filteredRules = rulesWithPostCount.filter((rule) =>
    rule.ruleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRule = selectedRuleId ? rulesWithPostCount.find((r) => r.id === selectedRuleId) : null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?");
    if (!confirmed) return;

    const previousPosts = posts;
    setPosts((prev) => prev.filter((post) => post.id !== id));

    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Không thể xóa bài đăng");
      router.refresh();
    } catch (error) {
      console.error(error);
      setPosts(previousPosts);
      alert("Xóa bài đăng thất bại. Vui lòng thử lại.");
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Filters và Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
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
      </div>

      {/* Danh sách quy tắc */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            onClick={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)}
            className={`cursor-pointer rounded-xl border p-4 transition-all ${
              selectedRuleId === rule.id
                ? "border-purple-500 bg-purple-50 shadow-lg"
                : "border-gray-200 bg-white hover:border-purple-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{rule.ruleName}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {rule.platform === "FACEBOOK" ? (
                    <>
                      📘 Facebook Page
                      {userPageName && <span className="ml-1 text-xs">({userPageName})</span>}
                    </>
                  ) : (
                    "📧 Email"
                  )}
                </p>
              </div>
              <div className="ml-4 text-right">
                <p className="text-2xl font-bold text-purple-600">{rule.postCount}</p>
                <p className="text-xs text-gray-500">bài đăng</p>
              </div>
            </div>

            {rule.postCount > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                <div>
                  <p className="text-xs text-gray-500">Lượt xem</p>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(rule.totalStats.views)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tương tác</p>
                  <p className="text-sm font-semibold text-blue-600">{formatNumber(rule.totalStats.interactions)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Chia sẻ</p>
                  <p className="text-sm font-semibold text-green-600">{formatNumber(rule.totalStats.shares)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bình luận</p>
                  <p className="text-sm font-semibold text-purple-600">{formatNumber(rule.totalStats.comments)}</p>
                </div>
              </div>
            )}

            {selectedRuleId === rule.id && (
              <div className="mt-4 border-t border-purple-200 pt-4">
                <p className="mb-2 text-xs font-medium text-purple-700">Nhấn để xem biểu đồ chi tiết ↓</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Biểu đồ thống kê cho quy tắc được chọn */}
      {selectedRule && selectedRule.postCount > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Thống kê hiệu quả: {selectedRule.ruleName}</h3>
              <p className="text-sm text-gray-500">{selectedRule.postCount} bài đăng</p>
            </div>
            <button
              onClick={() => setSelectedRuleId(null)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
          <RuleStatsChart posts={selectedRule.posts} />
        </div>
      )}

      {/* Danh sách bài đăng chi tiết (nếu cần) */}
      {selectedRule && selectedRule.posts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <h3 className="font-semibold text-gray-900">Chi tiết bài đăng: {selectedRule.ruleName}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-6 py-3">URL Bài đăng</th>
                  <th className="px-6 py-3 text-right">Lượt xem</th>
                  <th className="px-6 py-3 text-right">Tương tác</th>
                  <th className="px-6 py-3 text-right">Chia sẻ</th>
                  <th className="px-6 py-3 text-right">Bình luận</th>
                  <th className="px-6 py-3">Ngày đăng</th>
                  <th className="px-6 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedRule.posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {post.postUrl ? (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Xem bài đăng
                        </a>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Chưa có URL</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatNumber(post.views)}</td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">{formatNumber(post.interactions)}</td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">{formatNumber(post.shares)}</td>
                    <td className="px-6 py-4 text-right font-medium text-purple-600">{formatNumber(post.comments)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDelete(post.id, e)}
                          className="group flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:border-red-300 hover:bg-red-100"
                          title="Xóa bài đăng"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredRules.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            {searchTerm ? "Không tìm thấy quy tắc nào phù hợp" : "Chưa có quy tắc nào"}
          </p>
        </div>
      )}
    </div>
  );
}
