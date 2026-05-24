import { useState } from "react";
import type { WebAppSpec } from "@webapp-spec/types";
import { SpecProvider } from "@/hooks/useSpec";
import { NavProvider } from "@/hooks/useNavigation";
import { SimulationProvider } from "@/hooks/useSimulation";
import { SpecLoader } from "@/components/loading/SpecLoader";
import { Layout } from "@/components/layout/Layout";

export function App() {
  const [spec, setSpec] = useState<WebAppSpec | null>(null);

  if (!spec) {
    return <SpecLoader onLoad={setSpec} />;
  }

  return (
    <SpecProvider spec={spec}>
      <NavProvider>
        <SimulationProvider>
          <Layout onUnload={() => setSpec(null)} />
        </SimulationProvider>
      </NavProvider>
    </SpecProvider>
  );
}
