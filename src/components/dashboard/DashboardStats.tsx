interface DashboardStatsProps {
  productsCount: number;
  rulesCount: number;
  postsCount: number;
}

export function DashboardStats({ productsCount, rulesCount, postsCount }: DashboardStatsProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Stat Card 1 - Sản phẩm */}
      <div className="rounded-2xl bg-white p-6 shadow-lg shadow-orange-500/10 transition-all hover:shadow-orange-500/20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700">Sản phẩm</h3>
          <div className="rounded-full bg-orange-100 p-2 text-orange-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{productsCount}</p>
        <p className="text-sm text-gray-500">Sản phẩm đã tạo</p>
      </div>

      {/* Stat Card 2 - Quy tắc */}
      <div className="rounded-2xl bg-white p-6 shadow-lg shadow-purple-500/10 transition-all hover:shadow-purple-500/20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700">Quy tắc</h3>
          <div className="rounded-full bg-purple-100 p-2 text-purple-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{rulesCount}</p>
        <p className="text-sm text-gray-500">Quy tắc đã tạo</p>
      </div>

      {/* Stat Card 3 - Bài đăng */}
      <div className="rounded-2xl bg-white p-6 shadow-lg shadow-pink-500/10 transition-all hover:shadow-pink-500/20">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-700">Bài đăng</h3>
          <div className="rounded-full bg-pink-100 p-2 text-pink-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{postsCount}</p>
        <p className="text-sm text-gray-500">Bài đã đăng lên Page (có URL)</p>
      </div>
    </div>
  );
}

