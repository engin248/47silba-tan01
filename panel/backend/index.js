const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.json({ status: "backend çalışıyor" });
});

app.listen(4000, () => {
    console.log("http://localhost:4000");
});
