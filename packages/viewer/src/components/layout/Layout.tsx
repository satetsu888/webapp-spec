import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";

export function Layout({ onUnload }: { onUnload: () => void }) {
  return (
    <div className="flex h-screen">
      <Sidebar onUnload={onUnload} />
      <MainContent />
    </div>
  );
}
