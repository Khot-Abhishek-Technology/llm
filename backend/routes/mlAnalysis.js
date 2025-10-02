const express = require("express");
const router = express.Router();
const StudentPerformance = require("../models/studentPerformanceModel");
const mlCandidateAnalysis = require("../services/mlCandidateAnalysis");
const Student = require("../models/studentModel");

// Route to trigger ML analysis for a specific candidate
router.post("/analyzeCandidateML", async (req, res) => {
  try {
    const { ownerUserId, candidateEmail } = req.body;
    
    if (!ownerUserId || !candidateEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: ownerUserId and candidateEmail" 
      });
    }

    // Fetch candidate performance data
    const candidateData = await StudentPerformance.findOne({ 
      ownerUserId, 
      candidateEmail 
    });

    if (!candidateData) {
      return res.status(404).json({ 
        success: false, 
        message: "No performance data found for this candidate" 
      });
    }

    // Run ML analysis
    const analysis = await mlCandidateAnalysis.processCandidate(candidateData);

    res.json({ 
      success: true, 
      analysis 
    });

  } catch (error) {
    console.error("ML Analysis error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to analyze candidate data",
      error: error.message 
    });
  }
});

// Route to get all candidates for ML analysis
router.get("/getCandidatesForAnalysis", async (req, res) => {
  try {
    const { ownerUserId } = req.query;
    
    if (!ownerUserId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing ownerUserId" 
      });
    }

    const candidates = await StudentPerformance.find({ ownerUserId })
      .select('candidateEmail candidateName aggregates')
      .lean();

    res.json({ 
      success: true, 
      candidates 
    });

  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch candidates" 
    });
  }
});

// Route to analyze student performance and provide ML-based recommendations
router.post("/analyzeStudentML", async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required field: studentId" 
      });
    }

    // Fetch student data
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    // Convert student data to format expected by ML analysis
    const candidateData = {
      candidateEmail: student.email,
      candidateName: student.name || "Student",
      attempts: student.testHistory.map(test => ({
        attemptId: test.testId,
        testType: test.testType,
        startTime: test.completedAt,
        endTime: test.completedAt,
        totalTimeSeconds: test.timeSpent || 0,
        score: test.score,
        maxScore: test.maxScore,
        questions: test.questions.map(q => ({
          questionId: q.questionId,
          questionType: test.testType === 'technical' ? 'coding' : 'mcq',
          title: q.question,
          complexity: q.difficulty || 'medium',
          timeSpentSeconds: q.timeSpent || 0,
          isCorrect: q.isCorrect,
          attempts: 1,
        })),
        performanceMetrics: {
          accuracy: test.maxScore > 0 ? test.score / test.maxScore : 0,
          speedQpm: test.timeSpent > 0 ? (test.questions.length / (test.timeSpent / 60)) : 0,
        },
        cheatingIncidents: []
      }))
    };

    // Run ML analysis
    const analysis = await mlCandidateAnalysis.processCandidate(candidateData);

    // Update student record with ML insights
    if (analysis.analysis) {
      student.strengths = analysis.analysis.strengths.slice(0, 5);
      student.weaknesses = analysis.analysis.weaknesses.slice(0, 5);
      student.recommendedTopics = analysis.analysis.recommendations.slice(0, 3);
      student.overallProgress = Math.round(analysis.analysis.overallScore);
      await student.save();
    }

    res.json({ 
      success: true, 
      analysis: analysis.analysis,
      metadata: analysis.metadata
    });

  } catch (error) {
    console.error("Student ML Analysis error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to analyze student data",
      error: error.message 
    });
  }
});

module.exports = router;