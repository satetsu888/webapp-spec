import { Badge } from "./Badge";

type Props = {
  from: string;
  to: string;
};

export function StateArrow({ from, to }: Props) {
  const fromVariant = from === "_start" ? "green" : "gray";
  const toVariant = to === "_end" ? "red" : "blue";
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={fromVariant}>{from}</Badge>
      <span className="text-gray-400">&rarr;</span>
      <Badge variant={toVariant}>{to}</Badge>
    </span>
  );
}
