// src/app/rules/page.tsx
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { RuleForm } from "./RuleForm"; // Import Client Component
import Link from "next/link";



export const metadata = {
  title: "Quản lý Quy tắc - Auto Marketing",
  description: "Tạo và quản lý lịch đăng bài tự động cho sản phẩm",
};


export default async function RulesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để xem trang này.</p>
        <Link href="/" className="text-blue-600">Quay về trang chủ</Link>
      </main>
    );
  }

  // 1. Lấy danh sách quy tắc từ DB (Server Component)
  const rules = await db.autoPostRule.findMany({
    where: { userId: session.user.id },
    orderBy: { ruleName: "asc" },
  });

  // 2. Render UI
  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-cyan-50 via-blue-50 to-purple-50">
      {/* Subtle animated background */}
      <div className="animate-gradient absolute inset-0 bg-linear-to-br from-cyan-100/30 via-blue-100/20 to-purple-100/30 opacity-60" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="animate-slideInRight mb-8">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white/80 hover:text-purple-600 hover:shadow-md"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Trang chủ
          </Link>
        </div>

        {/* Title Section */}
        <div className="animate-fadeInUp mb-10 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 p-3 shadow-lg shadow-blue-500/40">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 bg-linear-to-r from-cyan-500 to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent">
            Quy tắc Tự động
          </h1>
          <p className="text-gray-600">Tạo và quản lý lịch đăng bài tự động cho sản phẩm</p>
        </div>
      
        {/* Form thêm quy tắc */}
        <div className="animate-scaleIn mb-12">
          <RuleForm />
        </div>

        {/* Danh sách quy tắc */}
        <div className="animate-fadeInUp mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Quy tắc của bạn</h2>
            <div className="flex items-center gap-2 rounded-full bg-linear-to-r from-cyan-500 to-blue-500 px-4 py-2 shadow-lg shadow-blue-500/40">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">
                {rules.length} quy tắc
              </span>
            </div>
          </div>
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-16 backdrop-blur-sm">
              <div className="mb-4 rounded-2xl bg-linear-to-br from-cyan-100 to-blue-100 p-6">
                <svg className="h-16 w-16 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900">Chưa có quy tắc nào</p>
              <p className="mt-2 text-sm text-gray-600">Hãy tạo quy tắc tự động đăng bài đầu tiên của bạn!</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {rules.map((rule) => (
              <li key={rule.id} className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-7 shadow-lg backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-linear-to-br from-cyan-500/0 to-purple-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
                
                <div className="relative">
                  <div className="mb-5 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 transition-colors group-hover:text-cyan-600">{rule.ruleName}</h3>
                    </div>
                    <span className={`rounded-full px-4 py-1.5 text-xs font-bold shadow-sm ${
                      rule.status === 'ACTIVE' 
                        ? 'bg-linear-to-r from-green-500 to-emerald-500 text-white shadow-green-500/30' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {rule.status === 'ACTIVE' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-white"></span>
                          Hoạt động
                        </span>
                      ) : '○ Tạm dừng'}
                    </span>
                  </div>
                  
                  <div className="mb-5 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 rounded-xl bg-linear-to-r from-cyan-50 to-cyan-100 px-4 py-3 shadow-sm">
                      <div className="rounded-lg bg-cyan-500 p-2">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {rule.frequency === 'DAILY' ? 'Hàng ngày' : 'Hàng tuần'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-linear-to-r from-purple-50 to-purple-100 px-4 py-3 shadow-sm">
                      <div className="rounded-lg bg-purple-500 p-2">
                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{rule.scheduleTime}</span>
                    </div>
                  </div>

                  <div className="mb-5 flex items-center gap-3 rounded-xl bg-linear-to-r from-indigo-50 to-indigo-100 px-4 py-3 shadow-sm">
                    <div className="rounded-lg bg-indigo-500 p-2">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nền tảng</span>
                      <p className="font-bold text-gray-900">{rule.platform}</p>
                    </div>
                  </div>

                  {(rule.nextRunAt ?? rule.lastRunAt) && (
                    <div className="mb-5 space-y-2 rounded-xl bg-linear-to-r from-gray-50 to-gray-100 p-4 shadow-inner">
                      {rule.nextRunAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="rounded-full bg-cyan-500 p-1.5">
                            <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chạy tiếp</span>
                            <p className="font-bold text-gray-900">{new Date(rule.nextRunAt).toLocaleString('vi-VN', {
                              timeZone: 'Asia/Ho_Chi_Minh',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}</p>
                          </div>
                        </div>
                      )}
                      {rule.lastRunAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="rounded-full bg-green-500 p-1.5">
                            <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chạy cuối</span>
                            <p className="font-bold text-gray-900">{new Date(rule.lastRunAt).toLocaleString('vi-VN', {
                              timeZone: 'Asia/Ho_Chi_Minh',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Mẫu Prompt
                    </p>
                    <div className="rounded-xl border-2 border-gray-200 bg-linear-to-br from-gray-50 to-white p-4 shadow-inner">
                      <p className="font-mono text-sm leading-relaxed text-gray-800">
                        {rule.promptTemplate}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      </div>
    </main>
  );
}
