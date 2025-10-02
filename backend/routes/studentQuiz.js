const express = require("express");
const router = express.Router();
const Student = require("../models/studentModel");
const Quiz = require("../models/quizModel");
const Tech = require("../models/techModel");
const User = require("../models/userModel");

// Get available quizzes for students
router.get("/getAvailableQuizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find().limit(10); // Get random quizzes

    const formattedQuizzes = quizzes.map((quiz) => ({
      id: quiz._id,
      question: quiz.que,
      options: {
        a: quiz.a,
        b: quiz.b,
        c: quiz.c,
        d: quiz.d,
      },
      correctAnswer: quiz.ans,
    }));

    res.json({
      success: true,
      quizzes: formattedQuizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch quizzes" });
  }
});

// Get available technical problems for students
router.get("/getAvailableTechProblems", async (req, res) => {
  try {
    const techProblems = await Tech.find();

    // Flatten all techEntries from all Tech documents
    const allProblems = techProblems.flatMap((tech) =>
      tech.techEntries.map((entry) => ({
        id: entry._id,
        title: entry.title,
        description: entry.desc,
      }))
    );

    // Shuffle and pick 2 random problems
    const randomProblems = allProblems
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    res.json({
      success: true,
      problems: randomProblems,
    });
  } catch (error) {
    console.error("Error fetching tech problems:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch technical problems",
    });
  }
});

// Get available technical problems for students
router.get("/getAvailableTechProblems", async (req, res) => {
  try {
    // Get problems from all users
    const users = await User.find().select("allTechProblems");
    const allProblems = users.flatMap((user) => user.allTechProblems || []);

    const formattedProblems = allProblems.map((problem, index) => ({
      id: problem.id || `problem_${index}`,
      title: problem.title,
      description: problem.desc,
    }));

    res.json({
      success: true,
      problems: formattedProblems.slice(0, 5), // Limit to 5 problems
    });
  } catch (error) {
    console.error("Error fetching tech problems:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch technical problems" });
  }
});

// Submit student quiz
router.post("/submitStudentQuiz", async (req, res) => {
  try {
    const { studentId, answers, timeSpent } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Get quiz questions to check answers
    const quizIds = answers.map((a) => a.questionId);
    const quizzes = await Quiz.find({ _id: { $in: quizIds } });

    let correctCount = 0;
    const results = [];

    for (const answer of answers) {
      const quiz = quizzes.find((q) => q._id.toString() === answer.questionId);
      if (quiz) {
        const isCorrect = quiz.ans === answer.selectedAnswer;
        if (isCorrect) correctCount++;

        results.push({
          questionId: answer.questionId,
          question: quiz.que,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: quiz.ans,
          isCorrect,
          timeSpent: answer.timeSpent || 0,
          explanation: `The correct answer is ${quiz.ans.toUpperCase()}. ${
            quiz[quiz.ans]
          }`,
        });
      }
    }

    // Add to test history
    const testRecord = {
      testId: new Date().getTime().toString(),
      testType: "aptitude",
      score: correctCount,
      maxScore: answers.length,
      completedAt: new Date(),
      timeSpent: timeSpent || 0,
      questions: results,
    };

    student.testHistory.push(testRecord);

    // Update progress and analytics
    await updateStudentAnalytics(student);
    await student.save();

    res.json({
      success: true,
      message: "Quiz submitted successfully",
      results: {
        score: correctCount,
        maxScore: answers.length,
        percentage: Math.round((correctCount / answers.length) * 100),
        questions: results,
      },
    });
  } catch (error) {
    console.error("Error submitting student quiz:", error);
    res.status(500).json({ success: false, message: "Failed to submit quiz" });
  }
});

// Submit student technical test
router.post("/submitStudentTechTest", async (req, res) => {
  try {
    const { studentId, solutions, timeSpent } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // For technical tests, we'll use a simple evaluation
    // In a real scenario, you'd want to run the code and check outputs
    const results = solutions.map((solution) => ({
      questionId: solution.problemId,
      question: solution.title,
      selectedAnswer: solution.code,
      correctAnswer: "Code submitted for review",
      isCorrect: solution.code.length > 50, // Simple check - has substantial code
      timeSpent: solution.timeSpent || 0,
      explanation:
        "Your code has been submitted and will be evaluated based on correctness, efficiency, and code quality.",
    }));

    const correctCount = results.filter((r) => r.isCorrect).length;

    // Add to test history
    const testRecord = {
      testId: new Date().getTime().toString(),
      testType: "technical",
      score: correctCount,
      maxScore: solutions.length,
      completedAt: new Date(),
      timeSpent: timeSpent || 0,
      questions: results,
    };

    student.testHistory.push(testRecord);

    // Update analytics
    await updateStudentAnalytics(student);
    await student.save();

    res.json({
      success: true,
      message: "Technical test submitted successfully",
      results: {
        score: correctCount,
        maxScore: solutions.length,
        percentage: Math.round((correctCount / solutions.length) * 100),
        questions: results,
      },
    });
  } catch (error) {
    console.error("Error submitting technical test:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit technical test" });
  }
});

// Helper function to update student analytics
async function updateStudentAnalytics(student) {
  const tests = student.testHistory;
  if (tests.length === 0) return;

  // Calculate overall progress
  const avgScore =
    tests.reduce((sum, test) => sum + (test.score / test.maxScore) * 100, 0) /
    tests.length;
  student.overallProgress = Math.round(avgScore);

  // Analyze strengths and weaknesses based on question topics
  const correctAnswers = tests.flatMap((test) =>
    test.questions.filter((q) => q.isCorrect)
  );
  const incorrectAnswers = tests.flatMap((test) =>
    test.questions.filter((q) => !q.isCorrect)
  );

  // Simple topic extraction (in real scenario, you'd have proper topic tagging)
  const getTopicsFromQuestions = (questions) => {
    const topics = [];
    questions.forEach((q) => {
      const question = q.question.toLowerCase();
      if (
        question.includes("math") ||
        question.includes("number") ||
        question.includes("calculate")
      ) {
        topics.push("Mathematics");
      } else if (question.includes("logic") || question.includes("reason")) {
        topics.push("Logical Reasoning");
      } else if (
        question.includes("data") ||
        question.includes("structure") ||
        question.includes("algorithm")
      ) {
        topics.push("Data Structures");
      } else if (question.includes("code") || question.includes("program")) {
        topics.push("Programming");
      } else {
        topics.push("General Aptitude");
      }
    });
    return topics;
  };

  const strongTopics = getTopicsFromQuestions(correctAnswers);
  const weakTopics = getTopicsFromQuestions(incorrectAnswers);

  // Count occurrences and get most common
  const countTopics = (topics) => {
    const counts = {};
    topics.forEach((topic) => (counts[topic] = (counts[topic] || 0) + 1));
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  };

  student.strengths = countTopics(strongTopics);
  student.weaknesses = countTopics(weakTopics);
  student.recommendedTopics = student.weaknesses.slice(0, 2);
}

module.exports = router;
