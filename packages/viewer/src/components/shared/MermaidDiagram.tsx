import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, theme: "default" });

type Props = {
  chart: string;
};

export function MermaidDiagram({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!containerRef.current) return;
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart);
        if (cancelled) return;
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="rounded border border-gray-200 bg-white p-4"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <details>
        <summary className="cursor-pointer text-xs text-gray-500">
          Mermaid source
        </summary>
        <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-3 text-xs">
          {chart}
        </pre>
      </details>
    </div>
  );
}
