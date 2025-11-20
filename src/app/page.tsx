import Link from "next/link";

// Import các hàm auth từ file auth chính của bạn
// (T3 Stack thường đặt ở '~/server/auth')
import { auth, signIn, signOut } from "~/server/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Animated background gradient */}
      <div className="animate-gradient absolute inset-0 bg-linear-to-br from-orange-300/20 via-pink-400/20 to-purple-400/20" />
      
      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
        {/* Logo/Brand section */}
        <div className="animate-fadeInUp mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-3xl bg-linear-to-br from-orange-500 to-pink-600 p-6 shadow-2xl shadow-pink-500/40">
              <svg className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h1 className="mb-3 bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl">
            Auto Marketing
          </h1>
          <p className="text-lg font-medium text-gray-700 sm:text-xl">
            Tự động hóa chiến dịch Marketing của bạn
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý sản phẩm • Tạo nội dung • Đăng bài tự động
          </p>
        </div>

        <div className="w-full max-w-4xl">
          {!session ? (
            <div className="animate-scaleIn flex flex-col items-center gap-6">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm sm:p-12">
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">Bắt đầu ngay</h2>
                  <p className="text-gray-600">Đăng nhập để trải nghiệm công cụ mạnh mẽ</p>
                </div>
                <SignInButton />
                
                {/* Features */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="text-center">
                    <div className="mb-2 flex justify-center">
                      <div className="rounded-full bg-orange-100 p-3">
                        <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Quản lý Sản phẩm</p>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex justify-center">
                      <div className="rounded-full bg-purple-100 p-3">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Tự động đăng</p>
                  </div>
                  <div className="text-center">
                    <div className="mb-2 flex justify-center">
                      <div className="rounded-full bg-pink-100 p-3">
                        <svg className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Phân tích hiệu quả</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fadeInUp flex flex-col items-center gap-6">
              <div className="w-full rounded-2xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm">
                <div className="mb-6 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="rounded-full bg-linear-to-r from-orange-500 to-pink-500 p-1">
                      <div className="rounded-full bg-white p-1">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-pink-600 text-2xl font-bold text-white">
                          {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Xin chào, {session.user.name ?? "người dùng"}!
                  </h2>
                  <p className="mt-1 text-gray-600">Chọn công cụ để bắt đầu</p>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/dashboard"
                    className="group relative overflow-hidden rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50 sm:col-span-2"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
                    <div className="relative flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Tổng quan Dashboard</h3>
                        <p className="text-sm text-blue-100">Xem thống kê và hoạt động</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/products"
                    className="group relative overflow-hidden rounded-xl bg-linear-to-br from-orange-500 to-pink-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/50"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
                    <div className="relative">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h3 className="mb-1 text-xl font-bold">Quản lý Sản phẩm</h3>
                      <p className="text-sm text-blue-100">Thêm và chỉnh sửa sản phẩm</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/rules"
                    className="group relative overflow-hidden rounded-xl bg-linear-to-br from-purple-500 to-blue-600 p-6 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
                    <div className="relative">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="mb-1 text-xl font-bold">Quy tắc Tự động</h3>
                      <p className="text-sm text-purple-100">Lên lịch đăng bài tự động</p>
                    </div>
                  </Link>
                </div>
                
                <div className="mt-6 text-center">
                  <SignOutButton />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>© 2025 Auto Marketing. All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}

// --- Client Components cho Nút bấm ---
// (Vì chúng dùng "use server" nên có thể để chung file)

function SignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("facebook", { redirectTo: "/dashboard" });
      }}
    >
      <button
        type="submit"
        className="group relative w-full overflow-hidden rounded-xl bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/50"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative flex items-center justify-center gap-3">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Đăng nhập với Facebook</span>
        </div>
      </button>
    </form>
  );
}

function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Đăng xuất
      </button>
    </form>
  );
}
