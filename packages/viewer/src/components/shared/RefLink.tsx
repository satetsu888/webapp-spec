import { Link } from "react-router";

type Props = {
  to: string;
  children: React.ReactNode;
  className?: string;
};

export function RefLink({ to, children, className }: Props) {
  return (
    <Link
      to={to}
      className={`text-blue-600 hover:underline ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}
