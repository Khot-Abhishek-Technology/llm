const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String },
  jobRole: { type: String },
  date: { type: String, default: Date },
  startTime: { type: String },
  endTime: { type: String },
  aptitudeTime: { type: String },
  techTime: { type: String },
  hrTime: { type: String },
  // Reference and aggregates for ML-based learning analytics
  studentPerformance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentPerformance",
  },
  learningPatterns: {
    preferredQuestionTypes: { type: [String], default: [] },
    strengthAreas: { type: [String], default: [] },
    weakAreas: { type: [String], default: [] },
    averageResponseTime: { type: Number, default: 0 },
    improvementRate: { type: Number, default: 0 },
  },
  mlPredictions: {
    predictedScore: { type: Number, default: 0 },
    confidenceLevel: { type: Number, default: 0 },
    recommendedFocus: { type: [String], default: [] },
    nextTestDifficulty: { type: String, default: "medium" },
  },
  allAptitudes: {
    type: Array,
    default: [],
  },
  allTechProblems: {
    type: Array,
    default: [],
  },
  aptitudePassingMarks: {
    type: Number,
    default: 0,
  },
  aptitudeScore: {
    type: Number,
    default: null,
  },
  technicalPassingMarks: {
    type: Number,
    default: 0,
  },
  aptitudePassesCandidates: {
    type: [String],
    default: [],
  },
  aptitudeFailedCandidates: {
    type: [String],
    default: [],
  },
  techPassesCandidates: {
    type: [String],
    default: [],
  },
  techFailedCandidates: {
    type: [String],
    default: [],
  },
  candidateData: {
    type: [
      {
        cheatImage: { type: String },
        cheatComment: { type: String },
        name: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],
    default: [],
  },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
