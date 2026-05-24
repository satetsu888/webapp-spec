import { NavLink } from "react-router";
import { useSpec } from "@/hooks/useSpec";

const sections: {
  path: string;
  label: string;
  getItems: (spec: ReturnType<typeof useSpec>) => { id: string }[];
}[] = [
  { path: "entities", label: "Entities", getItems: (s) => s.spec.domain.entities },
  { path: "relations", label: "Relations", getItems: () => [] },
  { path: "transitions", label: "Transitions", getItems: (s) => s.spec.domain.transitions },
  { path: "actors", label: "Actors", getItems: () => [] },
  { path: "usecases", label: "Usecases", getItems: (s) => s.spec.usecases },
  { path: "specs", label: "Specs", getItems: () => [] },
  { path: "reactions", label: "Reactions", getItems: () => [] },
  { path: "journeys", label: "Journeys", getItems: (s) => s.spec.journeys },
  { path: "views", label: "Views", getItems: (s) => s.spec.ui.views },
  { path: "simulation", label: "Simulation", getItems: () => [] },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return `block w-full px-4 py-1.5 text-left text-sm ${
    isActive
      ? "bg-blue-100 font-medium text-blue-800"
      : "text-gray-700 hover:bg-gray-100"
  }`;
}

function itemLinkClass({ isActive }: { isActive: boolean }) {
  return `block w-full truncate px-6 py-1 text-left text-sm ${
    isActive
      ? "bg-blue-50 font-medium text-blue-700"
      : "text-gray-600 hover:bg-gray-100"
  }`;
}

export function Sidebar({ onUnload }: { onUnload: () => void }) {
  const spec = useSpec();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="text-sm font-bold text-gray-800">WebAppSpec</span>
        <button
          onClick={onUnload}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Close
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((sec) => {
          const items = sec.getItems(spec);
          return (
            <div key={sec.path}>
              <NavLink to={`/${sec.path}`} end className={linkClass}>
                {sec.label}
                {items.length > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({items.length})
                  </span>
                )}
              </NavLink>
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={`/${sec.path}/${item.id}`}
                  className={itemLinkClass}
                >
                  {item.id}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
