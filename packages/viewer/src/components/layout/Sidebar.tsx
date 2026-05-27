import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
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
  { path: "scenarios", label: "Scenarios", getItems: (s) => s.spec.scenarios },
  { path: "views", label: "Views", getItems: (s) => s.spec.ui.views },
  { path: "simulation", label: "Simulation", getItems: () => [] },
];

function sectionLinkClass({ isActive }: { isActive: boolean }) {
  return `block flex-1 truncate py-1.5 pr-4 text-left text-sm ${
    isActive
      ? "font-medium text-blue-800"
      : "text-gray-700 hover:text-gray-900"
  }`;
}

function itemLinkClass({ isActive }: { isActive: boolean }) {
  return `block w-full truncate px-8 py-1 text-left text-sm ${
    isActive
      ? "bg-blue-50 font-medium text-blue-700"
      : "text-gray-600 hover:bg-gray-100"
  }`;
}

export function Sidebar({ onUnload }: { onUnload: () => void }) {
  const spec = useSpec();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleSection = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <span className="text-sm font-bold text-gray-800">{spec.spec.name}</span>
        <button
          onClick={() => { navigate("/"); onUnload(); }}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Close
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {sections.map((sec) => {
          const items = sec.getItems(spec);
          const hasChildren = items.length > 0;
          const childActive = location.pathname.startsWith(`/${sec.path}/`);
          const isExpanded = hasChildren && (expanded.has(sec.path) || childActive);

          return (
            <div key={sec.path}>
              <div
                className={`flex items-center hover:bg-gray-100 ${
                  location.pathname === `/${sec.path}` ? "bg-blue-100" : ""
                }`}
              >
                {hasChildren ? (
                  <button
                    onClick={() => toggleSection(sec.path)}
                    className="py-1.5 pl-2 pr-1 text-gray-400 hover:text-gray-600"
                  >
                    <span
                      className={`inline-block text-[10px] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    >
                      ▶
                    </span>
                  </button>
                ) : (
                  <span className="w-5 shrink-0" />
                )}
                <NavLink to={`/${sec.path}`} end className={sectionLinkClass}>
                  {sec.label}
                  {hasChildren && (
                    <span className="ml-1 text-xs text-gray-400">
                      ({items.length})
                    </span>
                  )}
                </NavLink>
              </div>
              {isExpanded &&
                items.map((item) => (
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
