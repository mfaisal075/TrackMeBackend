const express = require("express");
const cors = require("cors");

const path = require("path");

const app = express();

//Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Routes
const authRoutes = require("./routes/authRoutes");
const goalRoutes = require("./routes/goalRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api", authRoutes);
app.use("/api", goalRoutes);
app.use("/api", aiRoutes);

module.exports = app;
