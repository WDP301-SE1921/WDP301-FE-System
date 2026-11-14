import path from "node:path";
import { pathToFileURL } from "node:url";
import environment from "../demo/environment.cjs";
const admin = path.resolve(environment.root, "../WDP301-ADMIN-System");
process.env.VITE_DATA_SOURCE = "api";
process.env.VITE_API_BASE_URL = "http://localhost:5173/api/v1";
const { createServer } = await import(
  pathToFileURL(path.join(admin, "node_modules/vite/dist/node/index.js"))
);
const server = await createServer({
  root: admin,
  configFile: path.join(admin, "vite.config.js"),
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: { "/api": { target: "http://localhost:3000", changeOrigin: true } },
  },
});
await server.listen();
console.log(
  "Admin ready at localhost:5173, real local API; mock data disabled.",
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await server.close();
    process.exit(0);
  });
