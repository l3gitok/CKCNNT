import { auth } from "~/server/auth";
import Link from "next/link";

export const metadata = {
  title: "Tổng quan - Auto Marketing",
  description: "Tổng quan về hoạt động marketing của bạn",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="container mx-auto p-4">
        <p>Bạn cần đăng nhập để xem trang này.</p>
        <Link href="/" className="text-blue-600">Quay về trang chủ</Link>
      </main>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Xin chào, {session.user.name}!</h1>
        <p className="text-gray-600">Chào mừng bạn quay trở lại bảng điều khiển.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Stat Card 1 */}
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-pink-500/10 transition-all hover:shadow-pink-500/20">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Sản phẩm</h3>
            <div className="rounded-full bg-orange-100 p-2 text-orange-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">--</p>
          <p className="text-sm text-gray-500">Sản phẩm đang quản lý</p>
        </div>

        {/* Stat Card 2 */}
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-pink-500/10 transition-all hover:shadow-pink-500/20">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Bài đăng</h3>
            <div className="rounded-full bg-pink-100 p-2 text-pink-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">--</p>
          <p className="text-sm text-gray-500">Bài đã đăng trong tháng</p>
        </div>

        {/* Stat Card 3 */}
        <div className="rounded-2xl bg-white p-6 shadow-lg shadow-pink-500/10 transition-all hover:shadow-pink-500/20">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Quy tắc</h3>
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">--</p>
          <p className="text-sm text-gray-500">Quy tắc đang hoạt động</p>
        </div>
      </div>
    </>
  );
}
