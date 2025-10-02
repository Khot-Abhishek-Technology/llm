const express = require("express");
const router = express.Router();
const { getLocalLLM } = require("../services/localLLM");
require("dotenv").config();

const addOnPrompt = `
Generate an aptitude quiz with 10 questions. Each question should have:
- A question text.
- 4 options labeled A, B, C, and D.
- The correct answer.
- Questions on {{quizType}}

Return ONLY a valid JSON array of objects. Each object must contain:
{
  "id": "unique_id_string",
  "que": "Question text",
  "a": "option A",
  "b": "option B",
  "c": "option C",
  "d": "option D",
  "ans": "correct answer option (a, b, c, or d)"
}

Example output format:
[
  {
    "id": "q1_logical_reasoning",
    "que": "What comes next in the sequence: 2, 4, 8, 16, ?",
    "a": "24",
    "b": "32",
    "c": "28",
    "d": "20",
    "ans": "b"
  }
]
`;

router.get("/generateQuiz", async (req, res) => {
  let quizType = req.query.quizType;
  if (!quizType || quizType === null || quizType === "") {
    quizType =
      "aptitude including logical reasoning, problem solving, and critical thinking.";
  }

  try {
    const llm = getLocalLLM();
    const typeAddOnPrompt = addOnPrompt.replace("{{quizType}}", quizType);

    const responseText = await llm.generateJSON(typeAddOnPrompt, {
      temperature: 0.5,
      max_tokens: 3000,
    });

    // Ensure we have an array
    const questions = Array.isArray(responseText) ? responseText : [responseText];

    res.status(200).json(questions);
  } catch (error) {
    console.error("Error generating quiz:", error);
    res.status(500).send("Failed to generate quiz");
  }
});

module.exports = router;
