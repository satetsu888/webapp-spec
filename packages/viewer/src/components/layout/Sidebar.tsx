import { useSpec } from "@/hooks/useSpec";
import { useNavigation, type Section } from "@/hooks/useNavigation";

const sections: { key: Section; label: string; getItems: (spec: ReturnType<typeof useSpec>) => { id: string }[] }[] = [
  { key: "entities", label: "Entities", getItems: (s) => s.spec.domain.entities },
  { key: "relations", label: "Relations", getItems: (s) => s.spec.domain.relations },
  { key: "transitions", label: "Transitions", getItems: (s) => s.spec.domain.transitions },
  { key: "actors", label: "Actors", getItems: (s) => s.spec.actors },
  { key: "usecases", label: "Usecases", getItems: (s) => s.spec.usecases },
  { key: "specs", label: "Specs", getItems: (s) => s.spec.specs },
  { key: "reactions", label: "Reactions", getItems: () => [] },
  { key: "journeys", label: "Journeys", getItems: (s) => s.spec.journeys },
  { key: "views", label: "Views", getItems: (s) => s.spec.ui.views },
  { key: "simulation", label: "Simulation", getItems: () => [] },
];

export function Sidebar({ onUnload }: { onUnload: () => void }) {
  const spec = useSpec();
  const { nav, navigate } = useNavigation();

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
          const isActive = nav.section === sec.key;
          return (
            <div key={sec.key}>
              <button
                onClick={() => navigate(sec.key)}
                className={`w-full px-4 py-1.5 text-left text-sm ${
                  isActive && !nav.itemId
                    ? "bg-blue-100 font-medium text-blue-800"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {sec.label}
                {items.length > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({items.length})
                  </span>
                )}
              </button>
              {isActive &&
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(sec.key, item.id)}
                    className={`w-full truncate px-6 py-1 text-left text-sm ${
                      nav.itemId === item.id
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {item.id}
                  </button>
                ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
