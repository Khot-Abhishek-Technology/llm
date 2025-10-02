const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

// Connect to MongoDB
main()
  .then(() => {
    console.log("connection successful");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
}

// Real-time text update logic
let currentText = "";

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial data
  res.write(`data: ${JSON.stringify({ text: currentText })}\n\n`);

  const intervalId = setInterval(() => {
    res.write(`data: ${JSON.stringify({ text: currentText })}\n\n`);
  }, 1000);

  req.on("close", () => {
    clearInterval(intervalId);
  });
});

app.post("/api/update", (req, res) => {
  currentText = req.body.text;
  res.status(200).send("Text updated successfully");
});

// Other route imports
const signup = require("./routes/signup");
const login = require("./routes/login");
const addQuiz = require("./routes/addQuiz");
const getQuiz = require("./routes/getQuiz");
const generateQuiz = require("./routes/generateQuiz");
const updateUser = require("./routes/updateUser");
const generateTech = require("./routes/generateTech");
const addTech = require("./routes/addTech");
const getTech = require("./routes/getTech");
const getUserInfo = require("./routes/getUserInfo");
const checkTechSolution = require("./routes/checkTechSolution");
const cheatingDetected = require("./routes/cheatingDetected");
const performanceTracking = require("./routes/performanceTracking");
const mlAnalysis = require("./routes/mlAnalysis");
const studentAuth = require("./routes/studentAuth");
const studentDashboard = require("./routes/studentDashboard");
const studentQuiz = require("./routes/studentQuiz");

// Use routes
app.use(signup);
app.use(login);
app.use(addQuiz);
app.use(getQuiz);
app.use(generateQuiz);
app.use(updateUser);
app.use(generateTech);
app.use(addTech);
app.use(getTech);
app.use(getUserInfo);
app.use(checkTechSolution);
app.use(cheatingDetected);
app.use(performanceTracking);
app.use(mlAnalysis);
app.use(studentAuth);
app.use(studentDashboard);
app.use(studentQuiz);

// Test route for users

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
