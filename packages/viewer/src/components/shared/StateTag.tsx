import { useSpec } from "@/hooks/useSpec";

type Props = {
  entity: string;
  state: string;
};

export function StateTag({ entity, state }: Props) {
  const { stateColorClass } = useSpec();
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stateColorClass(entity, state)}`}
    >
      {state}
    </span>
  );
}
