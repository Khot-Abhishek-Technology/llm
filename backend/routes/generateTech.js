const express = require("express");
const router = express.Router();
const { getLocalLLM } = require("../services/localLLM");
require("dotenv").config();

const addOnPrompt = `
Generate a set of 4 technical interview questions on {{techType}} DSA problems. Each problem should include:
- A unique ID for the problem (not serializable).
- A title describing the problem.
- A detailed description of the problem, including:
  - Problem statement.
  - Input format.
  - Output format.
  - Example with input and output.
  - Constraints for the problem.
- Two test cases with:
  - A sample input for the problem.
  - The expected output for the provided input.

Format the description as a single string with line breaks and spaces for readability.

Return ONLY a valid JSON array of objects. Each object must follow this structure:
{
  "id": "unique_problem_id",
  "title": "Problem title",
  "desc": "Detailed problem description with proper formatting",
  "testCases": [
    {
      "input": "Sample input",
      "expectedOutput": "Expected output"
    },
    {
      "input": "Sample input",
      "expectedOutput": "Expected output"
    }
  ]
}

Example output format:
[
  {
    "id": "two_sum_problem",
    "title": "Two Sum",
    "desc": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\\n\\nInput Format:\\nAn array of integers and a target integer\\n\\nOutput Format:\\nArray of two indices\\n\\nExample:\\nInput: nums = [2,7,11,15], target = 9\\nOutput: [0,1]\\n\\nConstraints:\\n2 <= nums.length <= 10^4",
    "testCases": [
      {"input": "[2,7,11,15], 9", "expectedOutput": "[0,1]"},
      {"input": "[3,2,4], 6", "expectedOutput": "[1,2]"}
    ]
  }
]
`;

router.get("/generateTech", async (req, res) => {
  const techType = req.query.techType || "general algorithms";

  try {
    const llm = getLocalLLM();
    const typeAddOnPrompt = addOnPrompt.replace("{{techType}}", techType);

    const responseText = await llm.generateJSON(typeAddOnPrompt, {
      temperature: 0.6,
      max_tokens: 4000,
    });

    // Ensure we have an array
    const problems = Array.isArray(responseText) ? responseText : [responseText];

    res.status(200).json(problems);
  } catch (error) {
    console.error("Error generating tech quiz:", error);
    res.status(500).send("Failed to generate tech quiz");
  }
});

module.exports = router;
