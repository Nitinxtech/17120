const express = require("express");
const bodyParser = require("body-parser");
const { loggingMiddleware } = require("./logger");
const routes = require("./routes");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(loggingMiddleware);
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`URL Shortener running at http://localhost:${PORT}`);
});
