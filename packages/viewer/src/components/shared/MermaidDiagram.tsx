import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import mermaid from "mermaid";

mermaid.registerIconPacks([
  {
    name: "spec",
    loader: () =>
      Promise.resolve({
        prefix: "spec",
        icons: {
          actor: {
            body: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
            width: 24,
            height: 24,
          },
        },
        width: 24,
        height: 24,
      }),
  },
]);
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

type Props = {
  chart: string;
};

export function MermaidDiagram({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!containerRef.current) return;
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg, bindFunctions } = await mermaid.render(id, chart);
        if (cancelled) return;
        containerRef.current.innerHTML = svg;
        bindFunctions?.(containerRef.current);
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;
      const href = anchor.getAttributeNS("http://www.w3.org/1999/xlink", "href")
        ?? anchor.getAttribute("href");
      if (href?.startsWith("/")) {
        e.preventDefault();
        navigate(href);
      }
    };

    el.addEventListener("click", handleClick, true);
    return () => el.removeEventListener("click", handleClick, true);
  }, [navigate]);

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
