import "tsconfig-paths/register";

import app from "@/app";

const port = Number(process.env.PORT || 5000);

const server = app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
