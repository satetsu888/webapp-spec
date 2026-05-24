import { useState, useCallback, type DragEvent } from "react";
import type { WebAppSpec } from "@webapp-spec/types";
import { samples } from "@/samples";

type Props = {
  onLoad: (spec: WebAppSpec) => void;
};

export function SpecLoader({ onLoad }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseAndLoad = useCallback(
    (text: string) => {
      try {
        const parsed = JSON.parse(text) as WebAppSpec;
        if (!parsed.domain || !parsed.usecases) {
          setError("Invalid WebAppSpec format");
          return;
        }
        setError(null);
        onLoad(parsed);
      } catch {
        setError("Invalid JSON");
      }
    },
    [onLoad],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => parseAndLoad(reader.result as string);
      reader.readAsText(file);
    },
    [parseAndLoad],
  );

  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => parseAndLoad(reader.result as string);
      reader.readAsText(file);
    };
    input.click();
  }, [parseAndLoad]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg space-y-6 p-8">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          WebAppSpec Viewer
        </h1>

        <div
          className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <p className="text-gray-600">
            Drop a WebAppSpec JSON file here
          </p>
          <button
            onClick={handleFileSelect}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            or select a file
          </button>
        </div>

        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}

        {samples.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Or load a sample:
            </p>
            <div className="flex gap-2">
              {samples.map((s) => (
                <button
                  key={s.name}
                  onClick={() => onLoad(s.spec)}
                  className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
