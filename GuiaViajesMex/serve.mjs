import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename, dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const prefix = "/" + basename(root);
const port = Number(process.argv[2] ?? 8000);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (path === prefix) {
      response.writeHead(302, { Location: prefix + "/" }).end();
      return;
    }
    if (path.startsWith(prefix + "/")) path = path.slice(prefix.length);
    if (path.endsWith("/")) path += "index.html";
    const target = resolve(root, "." + path);
    const contentType = mime[extname(target)];
    if (!target.startsWith(root + sep) || !contentType || !(await stat(target)).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": contentType, "Cache-Control": "no-cache" });
    if (request.method === "HEAD") response.end();
    else createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log("Guía: http://127.0.0.1:" + port + "/");
  console.log("Ruta tipo GitHub Pages: http://127.0.0.1:" + port + prefix + "/");
});
