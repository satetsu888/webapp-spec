import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import type { WebAppSpec } from "@webapp-spec/types";
import { SpecProvider } from "@/hooks/useSpec";
import { SimulationProvider } from "@/hooks/useSimulation";
import { SpecLoader } from "@/components/loading/SpecLoader";
import { Layout } from "@/components/layout/Layout";
import { EntityList } from "@/components/domain/EntityList";
import { EntityDetail } from "@/components/domain/EntityDetail";
import { RelationList } from "@/components/domain/RelationList";
import { TransitionList } from "@/components/domain/TransitionList";
import { TransitionDetail } from "@/components/domain/TransitionDetail";
import { ActorList } from "@/components/actors/ActorList";
import { OperationList } from "@/components/operations/OperationList";
import { OperationDetail } from "@/components/operations/OperationDetail";
import { SpecList } from "@/components/specs/SpecList";
import { SideEffectList } from "@/components/sideeffects/SideEffectList";
import { ScenarioList } from "@/components/scenarios/ScenarioList";
import { ScenarioDetail } from "@/components/scenarios/ScenarioDetail";
import { ViewList } from "@/components/ui/ViewList";
import { ViewDetail } from "@/components/ui/ViewDetail";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";

function AppRoutes({ onUnload }: { onUnload: () => void }) {
  return (
    <Routes>
      <Route element={<Layout onUnload={onUnload} />}>
        <Route index element={<Navigate to="/domain/entities" replace />} />
        <Route path="domain/entities" element={<EntityList />} />
        <Route path="domain/entities/:id" element={<EntityDetail />} />
        <Route path="domain/relations" element={<RelationList />} />
        <Route path="domain/transitions" element={<TransitionList />} />
        <Route path="domain/transitions/:id" element={<TransitionDetail />} />
        <Route path="usecases/actors" element={<ActorList />} />
        <Route path="usecases/operations" element={<OperationList />} />
        <Route path="usecases/operations/:id" element={<OperationDetail />} />
        <Route path="specs" element={<SpecList />} />
        <Route path="usecases/side-effects" element={<SideEffectList />} />
        <Route path="scenarios" element={<ScenarioList />} />
        <Route path="scenarios/:id" element={<ScenarioDetail />} />
        <Route path="ui/views" element={<ViewList />} />
        <Route path="ui/views/:id" element={<ViewDetail />} />
        <Route path="simulation" element={<SimulationPanel />} />
      </Route>
    </Routes>
  );
}

export function App() {
  const [spec, setSpec] = useState<WebAppSpec | null>(null);

  return (
    <BrowserRouter>
      {spec ? (
        <SpecProvider spec={spec}>
          <SimulationProvider>
            <AppRoutes onUnload={() => setSpec(null)} />
          </SimulationProvider>
        </SpecProvider>
      ) : (
        <SpecLoader onLoad={setSpec} />
      )}
    </BrowserRouter>
  );
}
