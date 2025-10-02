const express = require("express");
const router = express.Router();
const Student = require("../models/studentModel");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(
  process.env.GEN_AI_API_KEY4 || process.env.GEN_AI_API_KEY8
);

// Get student dashboard data
router.get("/getStudentDashboard/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Trigger ML analysis if student has test history
    if (student.testHistory.length > 0) {
      try {
        await axios.post(
          `${
            process.env.BACKEND_URL || "http://localhost:3000"
          }/analyzeStudentML`,
          {
            studentId: studentId,
          }
        );
      } catch (mlError) {
        console.log(
          "ML analysis failed, continuing with basic analytics:",
          mlError.message
        );
      }
    }

    // Calculate performance metrics
    const totalTests = student.testHistory.length;
    const avgScore =
      totalTests > 0
        ? student.testHistory.reduce(
            (sum, test) => sum + (test.score / test.maxScore) * 100,
            0
          ) / totalTests
        : 0;

    const recentTests = student.testHistory
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5);

    const testsByType = {
      aptitude: student.testHistory.filter((t) => t.testType === "aptitude")
        .length,
      technical: student.testHistory.filter((t) => t.testType === "technical")
        .length,
    };

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          email: student.email,
          name: student.name,
          overallProgress: student.overallProgress,
        },
        performance: {
          totalTests,
          averageScore: Math.round(avgScore),
          testsByType,
          recentTests,
          strengths: student.strengths,
          weaknesses: student.weaknesses,
          recommendedTopics: student.recommendedTopics,
        },
        suggestedQuestions: student.suggestedQuestions
          .filter((q) => !q.completed)
          .slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Error fetching student dashboard:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard data" });
  }
});

// Generate personalized questions using Gemini AI
router.post("/generatePersonalizedQuestions", async (req, res) => {
  try {
    const { studentId, questionType = "aptitude", count = 5 } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Analyze student's past performance
    const pastTests = student.testHistory.filter(
      (t) => t.testType === questionType
    );
    const weakAreas = student.weaknesses.join(", ") || "general topics";
    const strengths = student.strengths.join(", ") || "basic concepts";

    // Calculate difficulty based on performance - improved logic
    const avgPerformance =
      pastTests.length > 0
        ? pastTests.reduce((sum, test) => sum + test.score / test.maxScore, 0) /
          pastTests.length
        : 0.5;

    let difficulty = "medium";
    let difficultyDescription = "";

    if (avgPerformance < 0.3) {
      difficulty = "easy";
      difficultyDescription = "basic and foundational";
    } else if (avgPerformance < 0.6) {
      difficulty = "medium";
      difficultyDescription = "intermediate level";
    } else if (avgPerformance < 0.8) {
      difficulty = "hard";
      difficultyDescription = "advanced and challenging";
    } else {
      difficulty = "very hard";
      difficultyDescription = "expert level and highly complex";
    }

    const prompt = `
Generate ${count} personalized ${questionType} questions for a student based on their performance analysis:

Student Performance Analysis:
- Average Performance: ${(avgPerformance * 100).toFixed(1)}%
- Weak Areas: ${weakAreas}
- Strong Areas: ${strengths}
- Recommended Difficulty: ${difficulty} (${difficultyDescription})
- Total Tests Taken: ${pastTests.length}

Question Generation Requirements:
1. Primary focus: Target weak areas (${weakAreas}) to help student improve
2. Difficulty level: Generate ${difficultyDescription} questions appropriate for their skill level
3. Question distribution: 70% on weak areas, 30% mixed topics for balanced learning
4. Include comprehensive explanations that teach concepts, not just correct answers
5. Provide specific learning tips and improvement strategies

Performance-based Adaptations:
${
  avgPerformance < 0.3
    ? "- Use simple language and basic concepts\n- Include step-by-step solution approaches\n- Focus on fundamental understanding"
    : ""
}
${
  avgPerformance >= 0.3 && avgPerformance < 0.6
    ? "- Mix basic and intermediate concepts\n- Include some challenging problems to push boundaries\n- Provide detailed reasoning for complex topics"
    : ""
}
${
  avgPerformance >= 0.6 && avgPerformance < 0.8
    ? "- Focus on advanced problem-solving techniques\n- Include multi-step reasoning problems\n- Challenge with edge cases and complex scenarios"
    : ""
}
${
  avgPerformance >= 0.8
    ? "- Present expert-level challenges\n- Include problems requiring creative thinking\n- Focus on optimization and advanced strategies"
    : ""
}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here",
    "options": {
      "a": "Option A text",
      "b": "Option B text", 
      "c": "Option C text",
      "d": "Option D text"
    },
    "correctAnswer": "a",
    "explanation": "Comprehensive explanation covering: why this answer is correct, why other options are incorrect, key concepts involved, and learning tips for improvement",
    "difficulty": "${difficulty}",
    "topic": "Specific topic name (prioritize weak areas: ${weakAreas})",
    "youtubeLink": "Hindi YouTube video link from Indian educator relevant to this topic"
  }
]

Make sure the JSON is valid and properly formatted.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response.text();

    // Clean and parse the response
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.slice(7);
    }
    if (cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.slice(0, -3);
    }

    const questions = JSON.parse(cleanedResponse);

    // Add questions to student's suggested questions
    const suggestedQuestions = questions.map((q) => ({
      questionId:
        new Date().getTime().toString() +
        Math.random().toString(36).substr(2, 9),
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      topic: q.topic,
      generatedAt: new Date(),
      completed: false,
    }));

    student.suggestedQuestions.push(...suggestedQuestions);
    await student.save();

    res.json({
      success: true,
      message: `Generated ${questions.length} personalized questions`,
      questions: suggestedQuestions,
    });
  } catch (error) {
    console.error("Error generating personalized questions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate questions",
      error: error.message,
    });
  }
});

// Submit suggested question test
router.post("/submitSuggestedTest", async (req, res) => {
  try {
    const { studentId, answers } = req.body; // answers: [{ questionId, selectedAnswer }]

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    let correctCount = 0;
    const results = [];

    // Process each answer
    for (const answer of answers) {
      const question = student.suggestedQuestions.find(
        (q) => q.questionId === answer.questionId
      );
      if (question) {
        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) correctCount++;

        question.completed = true;
        question.score = isCorrect ? 1 : 0;

        results.push({
          questionId: answer.questionId,
          question: question.question,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
        });
      }
    }

    // Add to test history
    const testRecord = {
      testId: new Date().getTime().toString(),
      testType: "suggested",
      score: correctCount,
      maxScore: answers.length,
      completedAt: new Date(),
      questions: results.map((r) => ({
        questionId: r.questionId,
        question: r.question,
        selectedAnswer: r.selectedAnswer,
        correctAnswer: r.correctAnswer,
        isCorrect: r.isCorrect,
        explanation: r.explanation,
      })),
    };

    student.testHistory.push(testRecord);

    // Update progress
    const totalTests = student.testHistory.length;
    const avgScore =
      student.testHistory.reduce(
        (sum, test) => sum + (test.score / test.maxScore) * 100,
        0
      ) / totalTests;
    student.overallProgress = Math.round(avgScore);

    await student.save();

    res.json({
      success: true,
      message: "Test submitted successfully",
      results: {
        score: correctCount,
        maxScore: answers.length,
        percentage: Math.round((correctCount / answers.length) * 100),
        questions: results,
      },
    });
  } catch (error) {
    console.error("Error submitting suggested test:", error);
    res.status(500).json({ success: false, message: "Failed to submit test" });
  }
});

// Update student profile
router.put("/updateStudentProfile", async (req, res) => {
  try {
    const { studentId, name } = req.body;

    const student = await Student.findByIdAndUpdate(
      studentId,
      { name },
      { new: true }
    );

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      student: {
        id: student._id,
        email: student.email,
        name: student.name,
      },
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
});

module.exports = router;
