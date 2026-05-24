import { useNavigation, type Section } from "@/hooks/useNavigation";

type Props = {
  section: Section;
  itemId?: string;
  children: React.ReactNode;
  className?: string;
};

export function RefLink({ section, itemId, children, className }: Props) {
  const { navigate } = useNavigation();
  return (
    <button
      onClick={() => navigate(section, itemId)}
      className={`text-blue-600 hover:underline ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
