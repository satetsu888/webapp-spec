import { StateTag } from "./StateTag";

type Props = {
  entity: string;
  from: string;
  to: string;
};

export function StateArrow({ entity, from, to }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      <StateTag entity={entity} state={from} />
      <span className="text-gray-400">&rarr;</span>
      <StateTag entity={entity} state={to} />
    </span>
  );
}
