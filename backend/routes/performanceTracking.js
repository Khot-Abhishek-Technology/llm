const express = require("express");
const router = express.Router();
const StudentPerformance = require("../models/studentPerformanceModel");
const mlService = require("../services/mlAnalysis");

// Helper to upsert a student's performance document
async function upsertStudent(ownerUserId, candidateEmail, candidateName) {
  const filter = { ownerUserId, candidateEmail };
  const update = { $setOnInsert: { ownerUserId, candidateEmail, candidateName } };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  const doc = await StudentPerformance.findOneAndUpdate(filter, update, options);
  return doc;
}

router.post("/trackQuizPerformance", async (req, res) => {
  try {
    const { ownerUserId, candidateEmail, candidateName, attempt } = req.body;
    if (!ownerUserId || !candidateEmail || !attempt) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const doc = await upsertStudent(ownerUserId, candidateEmail, candidateName);

    doc.attempts.push(attempt);
    // Update aggregates quickly
    const aggs = mlService.analyzeAttempts(doc.attempts);
    doc.aggregates = {
      totalAttempts: aggs.totalAttempts,
      avgAccuracy: aggs.avgAccuracy,
      avgSpeedQpm: aggs.avgSpeedQpm,
      commonWeakAreas: aggs.commonWeakAreas,
    };
    await doc.save();
    res.json({ success: true, message: "Quiz performance recorded" });
  } catch (err) {
    console.error("trackQuizPerformance error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/trackTechPerformance", async (req, res) => {
  try {
    const { ownerUserId, candidateEmail, candidateName, attempt } = req.body;
    if (!ownerUserId || !candidateEmail || !attempt) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const doc = await upsertStudent(ownerUserId, candidateEmail, candidateName);
    doc.attempts.push(attempt);
    const aggs = mlService.analyzeAttempts(doc.attempts);
    doc.aggregates = {
      totalAttempts: aggs.totalAttempts,
      avgAccuracy: aggs.avgAccuracy,
      avgSpeedQpm: aggs.avgSpeedQpm,
      commonWeakAreas: aggs.commonWeakAreas,
    };
    await doc.save();
    res.json({ success: true, message: "Technical performance recorded" });
  } catch (err) {
    console.error("trackTechPerformance error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/getStudentAnalytics", async (req, res) => {
  try {
    const { ownerUserId, candidateEmail } = req.query;
    if (!ownerUserId || !candidateEmail) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const doc = await StudentPerformance.findOne({ ownerUserId, candidateEmail });
    if (!doc) {
      return res.json({ success: true, analytics: { totalAttempts: 0, avgAccuracy: 0, avgSpeedQpm: 0, commonWeakAreas: [] } });
    }
    const analytics = mlService.analyzeAttempts(doc.attempts);
    const prediction = mlService.predictNextDifficulty(doc.attempts);
    res.json({ success: true, analytics, prediction });
  } catch (err) {
    console.error("getStudentAnalytics error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/getLearningRecommendations", async (req, res) => {
  try {
    const { ownerUserId, candidateEmail } = req.query;
    if (!ownerUserId || !candidateEmail) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const doc = await StudentPerformance.findOne({ ownerUserId, candidateEmail });
    if (!doc) {
      return res.json({ success: true, recommendations: [] });
    }
    const recs = mlService.generateRecommendations(doc.attempts);
    res.json({ success: true, ...recs });
  } catch (err) {
    console.error("getLearningRecommendations error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Return detailed attempts with per-question advanced metrics for a candidate
router.get("/getStudentAttempts", async (req, res) => {
  try {
    const { ownerUserId, candidateEmail } = req.query;
    if (!ownerUserId || !candidateEmail) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const doc = await StudentPerformance.findOne({ ownerUserId, candidateEmail });
    if (!doc) return res.json({ success: true, attempts: [] });
    res.json({ success: true, attempts: doc.attempts || [] });
  } catch (err) {
    console.error("getStudentAttempts error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;


