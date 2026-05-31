import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useSpec, type SpecLookups } from "@/hooks/useSpec";

type MenuSection = {
  path: string;
  label: string;
  getItems: (s: SpecLookups) => { id: string }[];
};

type MenuEntry =
  | { kind: "group"; label: string; prefix: string; children: MenuSection[] }
  | { kind: "section"; label: string; path: string; getItems: (s: SpecLookups) => { id: string }[] };

const menu: MenuEntry[] = [
  {
    kind: "group",
    label: "Domain",
    prefix: "domain",
    children: [
      { path: "entities", label: "Entities", getItems: (s) => s.spec.domain.entities },
      { path: "relations", label: "Relations", getItems: () => [] },
      { path: "transitions", label: "Transitions", getItems: (s) => s.spec.domain.transitions },
    ],
  },
  {
    kind: "group",
    label: "Usecases",
    prefix: "usecases",
    children: [
      { path: "actors", label: "Actors", getItems: () => [] },
      { path: "operations", label: "Operations", getItems: (s) => s.spec.usecases.operations },
      { path: "side-effects", label: "Side Effects", getItems: () => [] },
    ],
  },
  { kind: "section", path: "specs", label: "Specs", getItems: () => [] },
  { kind: "section", path: "scenarios", label: "Scenarios", getItems: (s) => s.spec.scenarios },
  {
    kind: "group",
    label: "UI",
    prefix: "ui",
    children: [
      { path: "views", label: "Views", getItems: (s) => s.spec.ui.views },
    ],
  },
  { kind: "section", path: "simulation", label: "Simulation", getItems: () => [] },
];

function sectionLinkClass({ isActive }: { isActive: boolean }) {
  return `block flex-1 truncate py-1.5 pr-4 text-left text-sm ${
    isActive
      ? "font-medium text-blue-800"
      : "text-gray-700 hover:text-gray-900"
  }`;
}

function itemLinkClass({ isActive }: { isActive: boolean }) {
  return `block w-full truncate px-10 py-1 text-left text-sm ${
    isActive
      ? "bg-blue-50 font-medium text-blue-700"
      : "text-gray-600 hover:bg-gray-100"
  }`;
}

function SectionRow({
  section,
  fullPath,
  indent,
  expanded,
  onToggle,
  pathname,
}: {
  section: MenuSection;
  fullPath: string;
  indent: boolean;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  pathname: string;
}) {
  const spec = useSpec();
  const items = section.getItems(spec);
  const hasChildren = items.length > 0;
  const childActive = pathname.startsWith(`/${fullPath}/`);
  const isExpanded = hasChildren && (expanded.has(fullPath) || childActive);

  return (
    <div>
      <div
        className={`flex items-center hover:bg-gray-100 ${
          pathname === `/${fullPath}` ? "bg-blue-100" : ""
        }`}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(fullPath)}
            className={`py-1.5 pr-1 text-gray-400 hover:text-gray-600 ${indent ? "pl-6" : "pl-2"}`}
          >
            <span
              className={`inline-block text-[10px] transition-transform ${isExpanded ? "rotate-90" : ""}`}
            >
              ▶
            </span>
          </button>
        ) : (
          <span className={indent ? "w-9 shrink-0" : "w-5 shrink-0"} />
        )}
        <NavLink to={`/${fullPath}`} end className={sectionLinkClass}>
          {section.label}
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
            to={`/${fullPath}/${item.id}`}
            className={itemLinkClass}
          >
            {item.id}
          </NavLink>
        ))}
    </div>
  );
}

export function Sidebar({ onUnload }: { onUnload: () => void }) {
  const spec = useSpec();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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
        {menu.map((entry) => {
          if (entry.kind === "section") {
            return (
              <SectionRow
                key={entry.path}
                section={entry}
                fullPath={entry.path}
                indent={false}
                expanded={expanded}
                onToggle={toggle}
                pathname={location.pathname}
              />
            );
          }

          const groupActive = entry.children.some(
            (c) =>
              location.pathname === `/${entry.prefix}/${c.path}` ||
              location.pathname.startsWith(`/${entry.prefix}/${c.path}/`),
          );
          const isGroupExpanded = expanded.has(entry.prefix) || groupActive;

          return (
            <div key={entry.prefix}>
              <button
                onClick={() => toggle(entry.prefix)}
                className={`flex w-full items-center gap-1 px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                  groupActive ? "font-medium text-blue-800" : "font-medium text-gray-500"
                }`}
              >
                <span
                  className={`inline-block text-[10px] transition-transform ${isGroupExpanded ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                {entry.label}
              </button>
              {isGroupExpanded &&
                entry.children.map((child) => (
                  <SectionRow
                    key={child.path}
                    section={child}
                    fullPath={`${entry.prefix}/${child.path}`}
                    indent={true}
                    expanded={expanded}
                    onToggle={toggle}
                    pathname={location.pathname}
                  />
                ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
