import { Sidebar, MobileTabBar } from "@/components/nav/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">{children}</div>
      </main>
      <MobileTabBar />
    </div>
  );
}
