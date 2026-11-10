// Sirve _site/ en http://localhost:8080 para verlo antes de publicar.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(import.meta.dirname, "..", "_site");
const PUERTO = Number(process.env.PORT) || 8080;
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".woff2": "font/woff2",
};

http.createServer((req, res) => {
  let ruta = path.join(RAIZ, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!ruta.startsWith(RAIZ)) return res.writeHead(403).end();
  if (fs.existsSync(ruta) && fs.statSync(ruta).isDirectory()) ruta = path.join(ruta, "index.html");
  if (!fs.existsSync(ruta)) return res.writeHead(404).end("No encontrado");
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(ruta)] || "application/octet-stream" });
  fs.createReadStream(ruta).pipe(res);
}).listen(PUERTO, () => console.log(`Abre http://localhost:${PUERTO}`));
