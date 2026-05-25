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
import { UsecaseList } from "@/components/usecases/UsecaseList";
import { UsecaseDetail } from "@/components/usecases/UsecaseDetail";
import { SpecList } from "@/components/specs/SpecList";
import { ReactionList } from "@/components/reactions/ReactionList";
import { ScenarioList } from "@/components/scenarios/ScenarioList";
import { ScenarioDetail } from "@/components/scenarios/ScenarioDetail";
import { ViewList } from "@/components/ui/ViewList";
import { ViewDetail } from "@/components/ui/ViewDetail";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";

function AppRoutes({ onUnload }: { onUnload: () => void }) {
  return (
    <Routes>
      <Route element={<Layout onUnload={onUnload} />}>
        <Route index element={<Navigate to="/entities" replace />} />
        <Route path="entities" element={<EntityList />} />
        <Route path="entities/:id" element={<EntityDetail />} />
        <Route path="relations" element={<RelationList />} />
        <Route path="transitions" element={<TransitionList />} />
        <Route path="transitions/:id" element={<TransitionDetail />} />
        <Route path="actors" element={<ActorList />} />
        <Route path="usecases" element={<UsecaseList />} />
        <Route path="usecases/:id" element={<UsecaseDetail />} />
        <Route path="specs" element={<SpecList />} />
        <Route path="reactions" element={<ReactionList />} />
        <Route path="scenarios" element={<ScenarioList />} />
        <Route path="scenarios/:id" element={<ScenarioDetail />} />
        <Route path="views" element={<ViewList />} />
        <Route path="views/:id" element={<ViewDetail />} />
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
