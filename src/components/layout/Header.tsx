"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-white/60 bg-white/80 px-8 backdrop-blur-md">
      {/* Left side - Breadcrumbs or Title */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>
      </div>

      {/* Right side - User Profile */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 hover:text-orange-600 transition-colors">
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name ?? "User"}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-orange-100">
            {user?.image ? (
              <Image src={user.image} alt={user.name ?? "User"} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-orange-500 to-pink-600 text-white font-bold">
                {user?.name?.[0] ?? "U"}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-2 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Đăng xuất"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
