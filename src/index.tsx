import path from "path";
// @ts-ignore
import { VNode, __INTERNALS, render } from "@westbrookdaniel/palm";
import { ComponentType } from "@westbrookdaniel/palm/jsx-runtime";

export * from "./build";

export const clientEntryMap = new Map();

/**
 * @example
 * export function MyComponent() {
 *   return <div data-component={id}>Hello World</div>;
 * }
 *
 * register(MyComponent, './MyComponent.tsx');
 */
export function register(Component: ComponentType, filepath: string) {
  const id = Math.random().toString(36).slice(2);

  const src = path.join("/_client", filepath);
  const p = src.replace(/\.(ts|tsx|jsx)$/, ".js");

  if (p === "/_client/_render.js") {
    throw new Error("Unable to register _render, it is a reserved name");
  }

  if (typeof window !== "undefined") {
    render;
    Component;
  } else {
    clientEntryMap.set(id, p);
  }
}

export type Handler = (req: Request) => Promise<Response | VNode>;

export async function renderRequest(req: Request, handler: Handler) {
  // Call the entry handler
  // Using __INTERNALS so we can check if it's a Response
  __INTERNALS.setup();
  const res = await handler(req);
  if (res instanceof Response) {
    __INTERNALS.reset();
    return res;
  }
  let html: string = await __INTERNALS.toString(res);
  __INTERNALS.reset();

  // Add a script for every entry (which will be served at /_client
  const scripts = Array.from(clientEntryMap.keys()).map((filepath) => {
    const src = path.join("/_client", filepath);
    const p = src.replace(/\.(ts|tsx|jsx)$/, ".js");
    return `<script src="${p}" type="module"></script>`;
  });

  // Add the scripts to the end of the body
  html = html.replace("</body>", scripts.join("\n") + "</body>");

  return new Response("<!DOCTYPE html>" + html, {
    headers: { "Content-Type": "text/html" },
  });
}
