import type { WebAppSpec } from "@webapp-spec/types";
import todoApp from "@samples/todo-app.json";
import blogApp from "@samples/blog-app.json";

export const samples: { name: string; spec: WebAppSpec }[] = [
  { name: "Todo App", spec: todoApp as unknown as WebAppSpec },
  { name: "Blog App", spec: blogApp as unknown as WebAppSpec },
];
