import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";

export function Layout({ onUnload }: { onUnload: () => void }) {
  return (
    <div className="flex h-screen">
      <Sidebar onUnload={onUnload} />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
