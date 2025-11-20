import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { auth } from "~/server/auth";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header user={session?.user} />
      <main className="ml-64 min-h-screen pt-16">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
