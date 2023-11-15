import path from "path";
// @ts-ignore
import { VNode, __INTERNALS } from "@westbrookdaniel/palm";

export * from "./build";

export const clientEntryMap = new Map();

export function include(filepath: string) {
  const src = path.join("/_client", filepath);
  const p = src.replace(/\.(ts|tsx|jsx)$/, ".js");
  clientEntryMap.set(filepath, p);
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

  // Add a script for every entry
  const scripts = Array.from(clientEntryMap.values()).map((src) => {
    return `<script src="${src}" type="module"></script>`;
  });

  // Add the scripts to the end of the body
  html = html.replace("</body>", scripts.join("\n") + "</body>");

  return new Response("<!DOCTYPE html>" + html, {
    headers: { "Content-Type": "text/html" },
  });
}
