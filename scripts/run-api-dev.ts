import http from "node:http";
import app from "../server/src/app.ts";

const port = Number(process.env.PORT ?? 5050);

http.createServer(app).listen(port, () => {
  console.log(`API server listening on http://localhost:${port}/api/v1`);
});
