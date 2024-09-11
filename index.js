const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 6969;

app.use(cors());
app.use(bodyParser.json());

const handleRequest = (req, res) => {
  const { code, desc, msg, status } = req.query;
  const responseBody = req.body;

  res.status(status ? parseInt(status) : 200).json({
    code: code || "20000001",
    desc: desc || "Default description",
    msg: msg || "Default message",
    result: responseBody,
  });
};

app.post("/mock", handleRequest);
app.get("/mock", handleRequest);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
