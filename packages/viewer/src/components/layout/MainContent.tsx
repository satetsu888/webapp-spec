import { useNavigation } from "@/hooks/useNavigation";
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
import { JourneyList } from "@/components/journeys/JourneyList";
import { JourneyDetail } from "@/components/journeys/JourneyDetail";
import { ViewList } from "@/components/ui/ViewList";
import { ViewDetail } from "@/components/ui/ViewDetail";
import { SimulationPanel } from "@/components/simulation/SimulationPanel";

export function MainContent() {
  const { nav } = useNavigation();

  const content = (() => {
    switch (nav.section) {
      case "entities":
        return nav.itemId ? <EntityDetail id={nav.itemId} /> : <EntityList />;
      case "relations":
        return <RelationList />;
      case "transitions":
        return nav.itemId ? (
          <TransitionDetail id={nav.itemId} />
        ) : (
          <TransitionList />
        );
      case "actors":
        return <ActorList />;
      case "usecases":
        return nav.itemId ? (
          <UsecaseDetail id={nav.itemId} />
        ) : (
          <UsecaseList />
        );
      case "specs":
        return <SpecList />;
      case "reactions":
        return <ReactionList />;
      case "journeys":
        return nav.itemId ? (
          <JourneyDetail id={nav.itemId} />
        ) : (
          <JourneyList />
        );
      case "views":
        return nav.itemId ? <ViewDetail id={nav.itemId} /> : <ViewList />;
      case "simulation":
        return <SimulationPanel />;
    }
  })();

  return <main className="flex-1 overflow-y-auto p-6">{content}</main>;
}
