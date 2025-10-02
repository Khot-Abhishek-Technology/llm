const mongoose = require("mongoose");

// Schema to capture detailed per-attempt metrics for a candidate under a recruiter (owner)
const errorSchema = new mongoose.Schema(
  {
    errorType: { type: String },
    errorMessage: { type: String },
    timestamp: { type: Date },
  },
  { _id: false }
);

const questionMetricSchema = new mongoose.Schema(
  {
    questionId: { type: String },
    questionType: { type: String, enum: ["mcq", "coding", "logic", "unknown"], default: "unknown" },
    title: { type: String },
    complexity: { type: String, enum: ["easy", "medium", "hard", "unknown"], default: "unknown" },
    languageUsed: { type: String },
    timeSpentSeconds: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 },
    isCorrect: { type: Boolean, default: false },
    linesOfCode: { type: Number },
    cyclomaticComplexity: { type: Number },
    errors: { type: [errorSchema], default: [] },
    // Advanced analysis fields (from Gemini)
    timeComplexityBigO: { type: String },
    spaceComplexityBigO: { type: String },
    primaryDataStructures: { type: [String], default: [] },
    secondaryDataStructures: { type: [String], default: [] },
    algorithmStrategy: { type: String },
    algorithmCategory: { type: String },
    patterns: { type: [String], default: [] },
    edgeCasesCovered: { type: [String], default: [] },
    bugTypes: { type: [String], default: [] },
    potentialImprovements: { type: [String], default: [] },
    codingStyleIssues: { type: [String], default: [] },
    testCaseCoverage: {
      type: new mongoose.Schema(
        {
          basic: { type: Boolean, default: false },
          edge: { type: Boolean, default: false },
          stress: { type: Boolean, default: false },
        },
        { _id: false }
      ),
      default: undefined,
    },
    misuseOfDataStructure: { type: Boolean },
    notes: { type: String },
  },
  { _id: false }
);

const cheatingIncidentSchema = new mongoose.Schema(
  {
    type: { type: String },
    timestamp: { type: Date, default: Date.now },
    severity: { type: Number, default: 1 },
    count: { type: Number, default: 1 },
  },
  { _id: false }
);

const performanceMetricsSchema = new mongoose.Schema(
  {
    accuracy: { type: Number, default: 0 },
    speedQpm: { type: Number, default: 0 },
    consistencyStdDev: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    attemptId: { type: String },
    testType: { type: String, enum: ["aptitude", "technical", "hr"], required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    totalTimeSeconds: { type: Number },
    score: { type: Number },
    maxScore: { type: Number },
    questions: { type: [questionMetricSchema], default: [] },
    cheatingIncidents: { type: [cheatingIncidentSchema], default: [] },
    performanceMetrics: { type: performanceMetricsSchema, default: {} },
  },
  { _id: false }
);

const studentPerformanceSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidateEmail: { type: String, required: true, index: true },
    candidateName: { type: String },
    attempts: { type: [attemptSchema], default: [] },
    aggregates: {
      totalAttempts: { type: Number, default: 0 },
      avgAccuracy: { type: Number, default: 0 },
      avgSpeedQpm: { type: Number, default: 0 },
      commonWeakAreas: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

studentPerformanceSchema.index({ ownerUserId: 1, candidateEmail: 1 }, { unique: true });

module.exports =
  mongoose.models.StudentPerformance ||
  mongoose.model("StudentPerformance", studentPerformanceSchema);


