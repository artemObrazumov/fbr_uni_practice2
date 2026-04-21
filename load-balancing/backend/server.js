const express = require("express");

const app = express();
const port = Number(process.env.PORT) || 3000;
const instance =
  process.env.INSTANCE_ID != null
    ? String(process.env.INSTANCE_ID)
    : String(port);

app.get("/", (_req, res) => {
  res.json({
    message: "Response from backend server",
    instance,
    port,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`instance=${instance} listening on ${port}`);
});
