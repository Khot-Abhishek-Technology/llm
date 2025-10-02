const express = require("express");
const router = express.Router();
const { getLocalLLM } = require("../services/localLLM");
require("dotenv").config();

router.post("/checkTechSolution", async (req, res) => {
  const {
    title,
    desc,
    code,
    language,
    attempts,
    timeSpentSeconds,
    linesOfCode,
  } = req.body;

  if (!title || !desc || !code) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  const addOnPrompt = `
You are an expert DSA interviewer and code reviewer. Analyze a candidate's solution.

Context:
- Problem Title: ${title}
- Problem Description: ${desc}
- Language: ${language || "unknown"}
- Candidate Code:\n\n${code}
- Observed Metrics (may be missing): attempts=${
    attempts ?? "unknown"
  }, timeSpentSeconds=${timeSpentSeconds ?? "unknown"}, linesOfCode=${
    linesOfCode ?? "unknown"
  }

Tasks:
1) Evaluate if solution likely satisfies problem requirements at a high level. Do NOT provide any solution code.
2) Produce a STRICT JSON object with these top-level keys only: evaluation, analysis.
3) The 'evaluation' object MUST contain:
   - success: boolean
   - summary: short string (<= 280 chars)
4) The 'analysis' object MUST contain:
   - time_complexity_big_o: string (e.g., O(n log n))
   - space_complexity_big_o: string
   - primary_data_structures: string[] (e.g., ["array", "hash_map"]) 
   - secondary_data_structures: string[]
   - algorithm_strategy: string (e.g., "two pointers", "binary search", "DFS")
   - algorithm_category: string (e.g., "graph", "dp", "greedy", "sorting")
   - difficulty: string in ["easy", "medium", "hard"]
   - patterns: string[] (e.g., ["sliding window", "prefix sums"]) 
   - edge_cases_covered: string[]
   - bug_types: string[] (e.g., ["off_by_one", "null_pointer", "overflow"]) 
   - potential_improvements: string[] (non-code suggestions)
   - coding_style_issues: string[]
   - test_case_coverage: object with fields: { basic: boolean, edge: boolean, stress: boolean }
   - misuse_of_data_structure: boolean
   - notes: string (<= 280 chars)

STRICT REQUIREMENTS:
- Return VALID JSON ONLY. No markdown, no prose outside JSON.
- Do NOT reveal or include any solution code.
- Be concise but informative.
`;

  try {
    const llm = getLocalLLM();
    const parsed = await llm.generateJSON(addOnPrompt, {
      temperature: 0.3,
      max_tokens: 2048,
    });

    // Validate response structure
    if (!parsed || typeof parsed !== 'object') {
      return res
        .status(500)
        .json({ success: false, error: "Invalid response from model" });
    }

    // Backwards compatibility: expose evaluation summary via cleanedResponse
    const cleanedResponse = {
      success: !!parsed?.evaluation?.success,
      summary: parsed?.evaluation?.summary || "",
    };

    res.status(200).json({
      success: true,
      cleanedResponse,
      analysis: parsed?.analysis || {},
    });
  } catch (error) {
    console.error("Error evaluating solution:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to evaluate the solution" });
  }
});

module.exports = router;
