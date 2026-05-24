type Variant = "blue" | "green" | "yellow" | "red" | "gray" | "purple";

const variantClasses: Record<Variant, string> = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-gray-100 text-gray-800",
  purple: "bg-purple-100 text-purple-800",
};

type Props = {
  variant?: Variant;
  children: React.ReactNode;
};

export function Badge({ variant = "gray", children }: Props) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
