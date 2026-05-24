import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Section =
  | "entities"
  | "relations"
  | "transitions"
  | "actors"
  | "usecases"
  | "specs"
  | "reactions"
  | "journeys"
  | "views"
  | "simulation";

export type NavState = {
  section: Section;
  itemId?: string;
};

type NavContextValue = {
  nav: NavState;
  navigate: (section: Section, itemId?: string) => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [nav, setNav] = useState<NavState>({ section: "entities" });

  const navigate = useCallback((section: Section, itemId?: string) => {
    setNav({ section, itemId });
  }, []);

  return (
    <NavContext.Provider value={{ nav, navigate }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavigation must be used within NavProvider");
  return ctx;
}
