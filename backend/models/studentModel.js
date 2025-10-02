const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    lastLogin: { type: Date },

    // Performance tracking
    testHistory: [
      {
        testId: { type: String },
        // testType: { type: String, enum: ["aptitude", "technical"] },
        testType: { type: String },
        score: { type: Number },
        maxScore: { type: Number },
        completedAt: { type: Date, default: Date.now },
        timeSpent: { type: Number }, // in seconds
        questions: [
          {
            questionId: { type: String },
            question: { type: String },
            selectedAnswer: { type: String },
            correctAnswer: { type: String },
            isCorrect: { type: Boolean },
            timeSpent: { type: Number },
            explanation: { type: String },
          },
        ],
      },
    ],

    // Personalized suggestions
    suggestedQuestions: [
      {
        questionId: { type: String },
        question: { type: String },
        options: {
          a: { type: String },
          b: { type: String },
          c: { type: String },
          d: { type: String },
        },
        correctAnswer: { type: String },
        explanation: { type: String },
        difficulty: { type: String, enum: ["easy", "medium", "hard"] },
        topic: { type: String },
        generatedAt: { type: Date, default: Date.now },
        completed: { type: Boolean, default: false },
        score: { type: Number },
      },
    ],

    // Analytics
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendedTopics: [{ type: String }],
    overallProgress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Student || mongoose.model("Student", studentSchema);
