import path from "path";
import { clientEntryMap } from ".";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["b", "kb", "mb"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`;
}

export async function buildClient() {
  const entrypoints = Array.from(clientEntryMap.keys()).map((file) =>
    path.join(process.cwd(), file),
  );

  const buildOutput = await Bun.build({
    entrypoints,
    root: ".",
    outdir: "./dist/_client",
    minify: true,
    target: "browser",
    splitting: true,
  });

  if (buildOutput.logs.length) {
    console.log(buildOutput.logs.join("\n"));
  }

  buildOutput.outputs.forEach((o) => {
    console.log(
      `${formatBytes(o.size)} - ${o.path.substring(process.cwd().length)}`,
    );
  });
}

export async function serveClient(req: Request) {
  const url = new URL(req.url);

  // Serve the built island files
  if (url.pathname.startsWith("/_client")) {
    const builtPath = path.join("./dist", url.pathname);
    const file = Bun.file(path.join(process.cwd(), builtPath));
    return new Response(file);
  }

  return req;
}
