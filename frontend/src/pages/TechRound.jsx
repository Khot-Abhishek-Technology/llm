import { useState, useEffect, useRef } from "react";
import {
  Play,
  AlertCircle,
  Sun,
  Clock,
  Moon,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import sendHREmail from "../components/HRemail";
import sendCheatEmail from "../components/CheatingEmail";
import Editor from "@monaco-editor/react";

// Keep existing global variables
let current = "entrance";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const LANGUAGE_VERSIONS = {
  python: "3.10.0",
  javascript: "18.15.0",
  java: "15.0.2",
  cpp: "10.2.0",
  c: "10.2.0",
  go: "1.16.2",
  ruby: "3.0.1",
  rust: "1.68.2",
  php: "8.2.3",
};

const MONACO_LANGUAGE_MAP = {
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  ruby: "ruby",
  rust: "rust",
  php: "php",
};

const DEFAULT_SNIPPETS = {
  python: `def solve():
    # TODO: implement your logic
    return ""

if __name__ == "__main__":
    result = solve()
    print(result)
`,
  javascript: `function solve() {
  // TODO: implement your logic
  return "";
}
console.log(solve());
`,
  java: `import java.io.*;
public class Main {
  static String solve() {
    // TODO: implement your logic
    return "";
  }
  public static void main(String[] args) throws Exception {
    System.out.print(solve());
  }
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
string solve() {
  // TODO: implement your logic
  return "";
}
int main() {
  cout << solve();
  return 0;
}
`,
  c: `#include <stdio.h>
const char* solve() {
  // TODO: implement your logic
  return "";
}
int main() {
  printf("%s", solve());
  return 0;
}
`,
  go: `package main
import "fmt"
func solve() string {
  // TODO: implement your logic
  return ""
}
func main() {
  fmt.Print(solve())
}
`,
  ruby: `def solve
  # TODO: implement your logic
  ""
end
puts solve
`,
  rust: `fn solve() -> String {
    // TODO: implement your logic
    "".to_string()
}
fn main() {
    print!("{}", solve());
}
`,
  php: `<?php
function solve() {
  // TODO: implement your logic
  return "";
}
echo solve();
`,
};

let currentlyScored = 0;
let isPasteAllowed = true;

// Keep existing API setup
const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

// Keep existing executeCode function
const executeCode = async (language, sourceCode) => {
  const response = await API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [{ content: sourceCode }],
  });
  return response.data;
};

const TechRound = () => {
  const [codeStore, setCodeStore] = useState({});
  const [languageCodeStore, setLanguageCodeStore] = useState({});
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState("");
  // Combined state variables from both components
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [candidateEmails, setCandidatesEmails] = useState([]);
  const [showLoginForm, setShowLoginForm] = useState(true);

  // Original TechRound states
  const [problems, setProblems] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitRunning, setSubmitIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [techSolvedArr, setTechSolvedArr] = useState([]);
  const [jobRole, setjobRole] = useState("");
  const [companyName, setcompanyName] = useState("");
  const [techTiming, setTechTiming] = useState(
    localStorage.getItem("techTime") || 0
  );
  const [remainingTime, setRemainingTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentPage, setCurrentPage] = useState("entrance");
  const [passingMarks, setpassingMarks] = useState("");
  const [testCaseResults, setTestCaseResults] = useState([]);
  const [attemptStartTimeMs, setAttemptStartTimeMs] = useState(Date.now());
  const [perProblemMetrics, setPerProblemMetrics] = useState({});
  const [showCheatingModal, setShowCheatingModal] = useState(false);
  const hasSentCheatRef = useRef(false);

  const sendCheatNotification = async (reason = "Policy violation detected") => {
    try {
      const templateParams = {
        user_id: localStorage.getItem("technicalUserId") || userId,
        candidate_name: localStorage.getItem("userName") || name,
        to_email: localStorage.getItem("technicalUserEmail") || email,
        round_name: "Technical Round",
        reason:"Cheating in tech round",
        timestamp: new Date().toISOString(),
      };
      await sendCheatEmail(templateParams);
    } catch (e) {
      console.error("Failed to send cheating email:", e);
    }
  };

  // Helpers for per-problem, per-language code storage
  const getStoredCode = (problemIdx, language) => {
    const problemMap = languageCodeStore[problemIdx] || {};
    return problemMap[language] ?? "";
  };

  const setStoredCode = (problemIdx, language, value) => {
    setLanguageCodeStore((prev) => {
      const prevProblem = prev[problemIdx] || {};
      return {
        ...prev,
        [problemIdx]: { ...prevProblem, [language]: value },
      };
    });
  };

  // Login form handler (Previously in UserInfoDialog)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!userId.trim()) {
        console.error("No userId found.");
        alert("User ID is required.");
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/getUserInfo/${userId}`);
      const emails =
        response.data.candidateData?.map((candidate) => candidate.email) || [];
      setCandidatesEmails(emails);

      const emailExists = emails.some(
        (candidateEmail) => candidateEmail === email
      );

      if (!emailExists) {
        alert("Email does not exist. Please enter a valid email.");
        return;
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      alert("Failed to fetch user info. Please try again later.");
      return;
    }

    if (!name.trim()) {
      setLoginError("Name is required");
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setLoginError("Please enter a valid email");
      return;
    }

    localStorage.setItem("userName", name);
    localStorage.setItem("technicalUserId", userId);
    localStorage.setItem("technicalUserEmail", email);

    isPasteAllowed = false;

    try {
      const response = await axios.get(`${BACKEND_URL}/getUserInfo/${userId}`);
      const techTime = response.data.techTime || 0;
      localStorage.setItem("techTime", techTime);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }

    setShowLoginForm(false);
    setLoading(false);
    // Start attempt timer for ML tracking
    try {
      setAttemptStartTimeMs(Date.now());
    } catch (_) {}
  };

  // Keep all existing useEffect hooks from TechRound component
  // Paste event listener
  useEffect(() => {
    const handlePaste = (e) => {
      if (!isPasteAllowed) {
        e.preventDefault();
        alert("Pasting is disabled during the technical round.");
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Visibility change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isPasteAllowed) {
        setShowCheatingModal(true);
        if (!hasSentCheatRef.current) {
          hasSentCheatRef.current = true;
          sendCheatNotification("Tab switch or window minimized during test");
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            handleTimeExpired();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingTime]);

  // Dark mode effect
  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    document.body.classList.toggle("light", !isDarkMode);
  }, [isDarkMode]);

  // Fetch problems effect
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/getTech`, {
          params: { userId: localStorage.getItem("technicalUserId") },
          headers: { "Content-Type": "application/json" },
        });
        const validProblems = response.data.techEntries.filter(
          (problem) => problem && typeof problem === "object" && problem.title
        );
        setProblems(validProblems);
        const initialCodeStore = {};
        validProblems.forEach((_, index) => {
          initialCodeStore[index] = "";
        });
        setCodeStore(initialCodeStore);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tech:", error);
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  const handleEndSession = async () => {
    alert(
      "Do you really want to end this session, all your problems will be sent for checking?"
    );
    console.log("starthere");
    console.log(
      "Passing for tech : ",
      passingMarks,
      "CandidateSolved are : ",
      currentlyScored
    );

    try {
      // Make the API call and wait for the response
      const response = await axios.post(`${BACKEND_URL}/updateUser`, {
        userId: localStorage.getItem("technicalUserId"),
        userEmail: localStorage.getItem("technicalUserEmail"),
        technicalScore: currentlyScored,
      });
      console.log("============:", response.data);

      // Track ML performance for this technical attempt (including advanced analysis if present)
      try {
        const techUserId = localStorage.getItem("technicalUserId");
        const techEmail = localStorage.getItem("technicalUserEmail");
        const attemptPayload = {
          ownerUserId: techUserId,
          candidateEmail: techEmail,
          candidateName: localStorage.getItem("userName") || name,
          attempt: {
            attemptId: `${techEmail}-${Date.now()}`,
            testType: "technical",
            startTime: new Date(attemptStartTimeMs),
            endTime: new Date(),
            totalTimeSeconds: Math.max(0, Math.round((Date.now() - attemptStartTimeMs) / 1000)),
            score: currentlyScored,
            maxScore: problems.length,
            questions: Object.values(perProblemMetrics),
            cheatingIncidents: [],
            performanceMetrics: {},
          },
        };
        await axios.post(`${BACKEND_URL}/trackTechPerformance`, attemptPayload);
      } catch (mlErr) {
        console.error("Failed to track technical performance:", mlErr);
      }

      if (
        response.data.techPass === "true" ||
        response.data.techPass === true
      ) {
        console.log("Send email to hr round");
        const templateParams = {
          to_email: localStorage.getItem("technicalUserEmail"),
          jobRole: jobRole,
          linkForNextRound: ` ${VITE_FRONTEND_URL}/hrRoundEntrance`,
          companyName: companyName,
        };

        try {
          await sendHREmail(templateParams);
          console.log("Email sent successfully!");
        } catch (emailError) {
          console.error("Failed to send email:", emailError);
        }
      }

      alert(
        "You have successfully completed the Technical round, we will update you to through the email soon."
      );
      window.location.reload(true);
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user. Please try again.");
    }
  };

  // Fetch user info and set technical timing
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = localStorage.getItem("technicalUserId");
        if (!userId) {
          console.error("No userId found in localStorage.");
          return;
        }

        const response = await axios.get(
          `${BACKEND_URL}/getUserInfo/${userId}`
        );

        console.log("All backend data : ", response.data);

        const techTime = response.data.techTime || 0;
        setTechTiming(techTime);
        setRemainingTime(techTime * 60); // Convert minutes to seconds
        setIsTimerRunning(true);
        setjobRole(response.data.jobRole);
        setcompanyName(response.data.companyName);
        setpassingMarks(response.data.technicalPassingMarks);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [techTiming]);

  useEffect(() => {
    let interval;
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            handleTimeExpired();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, remainingTime]);

  const handleTestCases = (currentProblem, output) => {
    if (
      !currentProblem?.testCases ||
      !Array.isArray(currentProblem.testCases) ||
      currentProblem.testCases.length === 0
    ) {
      return [];
    }

    return currentProblem.testCases.map((testCase) => {
      // Ensure testCase and its properties exist and convert to strings
      const expectedOutput = String(testCase?.expectedOutput || "");
      const actualOutput = String(output || "");
      const input = String(testCase?.input || "");

      const isCorrect = compareTestCaseOutputs(expectedOutput, actualOutput);

      return {
        input,
        expectedOutput,
        actualOutput,
        isCorrect,
      };
    });
  };

  const handleTimeExpired = async () => {
    // Attempt to submit all solved problems
    try {
      for (let i = 0; i < problems.length; i++) {
        const problemCode = codeStore[i] || code;

        if (problemCode) {
          await axios.post(`${BACKEND_URL}/checkTechSolution`, {
            title: problems[i].title,
            desc: problems[i].desc,
            code: problemCode,
          });
        }
      }

      // Update user after submitting all problems
      handleEndSession();
    } catch (error) {
      console.error("Error submitting problems on time expiration:", error);
    }

    // You might want to add a modal or redirect logic here
    alert("Technical round time has expired!");
    handleEndSession();
  };

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/getTech`, {
          params: { userId: localStorage.getItem("technicalUserId") },
          headers: { "Content-Type": "application/json" },
        });

        // Filter out empty problems and ensure we have valid problem objects
        const validProblems = response.data.techEntries.filter(
          (problem) => problem && typeof problem === "object" && problem.title
        );

        setProblems(validProblems);
        console.log("Tech data: ", validProblems);

        // Initialize code store for all problems
        const initialCodeStore = {};
        validProblems.forEach((_, index) => {
          initialCodeStore[index] = "";
        });
        setCodeStore(initialCodeStore);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tech:", error);
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Update the handleRunCode function
  const handleRunCode = async () => {
    setIsRunning(true);
    setError(null);
    setOutput("");
    setTestCaseResults([]);

    try {
      const result = await executeCode(selectedLanguage, code);
      const output = result.run.output || "No output";
      setOutput(output);

      // Safely get the current problem
      const currentProblem = problems[currentProblemIndex];
      if (currentProblem) {
        const results = handleTestCases(currentProblem, output);
        setTestCaseResults(results);
        const allCorrect = results.length > 0 && results.every((r) => r.isCorrect);
        const elapsedSec = Math.max(0, Math.round((Date.now() - attemptStartTimeMs) / 1000));
        const loc = (code || "").split("\n").length;

        // Call backend Gemini analysis for advanced metrics
        try {
          const analysisResp = await axios.post(`${BACKEND_URL}/checkTechSolution`, {
            title: currentProblem.title,
            desc: currentProblem.desc,
            code,
            language: selectedLanguage,
            attempts: (perProblemMetrics?.[currentProblemIndex]?.attempts || 0) + 1,
            timeSpentSeconds: elapsedSec,
            linesOfCode: loc,
          });
          const advanced = analysisResp.data?.analysis || {};

          setPerProblemMetrics((prev) => ({
            ...prev,
            [currentProblemIndex]: {
              questionId: String(currentProblemIndex),
              questionType: "coding",
              title: currentProblem.title || "",
              complexity: advanced?.difficulty || "unknown",
              languageUsed: selectedLanguage,
              timeSpentSeconds: elapsedSec,
              attempts: (prev?.[currentProblemIndex]?.attempts || 0) + 1,
              isCorrect: allCorrect,
              linesOfCode: loc,
              cyclomaticComplexity: undefined,
              errors: results
                .filter((r) => !r.isCorrect)
                .map((r) => ({
                  errorType: "wrong_answer",
                  errorMessage: `input:${r.input} expected:${r.expectedOutput} actual:${r.actualOutput}`,
                  timestamp: new Date(),
                })),
              // Advanced analysis fields
              timeComplexityBigO: advanced?.time_complexity_big_o,
              spaceComplexityBigO: advanced?.space_complexity_big_o,
              primaryDataStructures: advanced?.primary_data_structures,
              secondaryDataStructures: advanced?.secondary_data_structures,
              algorithmStrategy: advanced?.algorithm_strategy,
              algorithmCategory: advanced?.algorithm_category,
              patterns: advanced?.patterns,
              edgeCasesCovered: advanced?.edge_cases_covered,
              bugTypes: advanced?.bug_types,
              potentialImprovements: advanced?.potential_improvements,
              codingStyleIssues: advanced?.coding_style_issues,
              testCaseCoverage: advanced?.test_case_coverage,
              misuseOfDataStructure: advanced?.misuse_of_data_structure,
              notes: advanced?.notes,
            },
          }));
        } catch (analysisErr) {
          // Fallback to basic metrics if analysis fails
          setPerProblemMetrics((prev) => ({
            ...prev,
            [currentProblemIndex]: {
              questionId: String(currentProblemIndex),
              questionType: "coding",
              title: currentProblem.title || "",
              complexity: "unknown",
              languageUsed: selectedLanguage,
              timeSpentSeconds: elapsedSec,
              attempts: (prev?.[currentProblemIndex]?.attempts || 0) + 1,
              isCorrect: allCorrect,
              linesOfCode: loc,
              cyclomaticComplexity: undefined,
              errors: results
                .filter((r) => !r.isCorrect)
                .map((r) => ({
                  errorType: "wrong_answer",
                  errorMessage: `input:${r.input} expected:${r.expectedOutput} actual:${r.actualOutput}`,
                  timestamp: new Date(),
                })),
            },
          }));
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred while executing the code");
    } finally {
      setIsRunning(false);
    }
  };

  const compareTestCaseOutputs = (expectedOutput, actualOutput) => {
    // Ensure inputs are strings
    const trimmedExpected = String(expectedOutput).trim();
    const trimmedActual = String(actualOutput).trim();

    // Direct string comparison
    if (trimmedExpected === trimmedActual) {
      return true;
    }

    // Number comparison
    const numExpected = Number(trimmedExpected);
    const numActual = Number(trimmedActual);
    if (!isNaN(numExpected) && !isNaN(numActual) && numExpected === numActual) {
      return true;
    }

    // Float comparison with precision
    const floatExpected = parseFloat(trimmedExpected);
    const floatActual = parseFloat(trimmedActual);
    if (!isNaN(floatExpected) && !isNaN(floatActual)) {
      return Math.abs(floatExpected - floatActual) < 1e-9;
    }

    // Array-like comparison
    const normalizeArrayOutput = (output) => {
      try {
        return String(output)
          .replace(/[\[\]]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .map((item) => item.trim())
          .filter((item) => item !== "")
          .join(" ");
      } catch (error) {
        console.error("Error normalizing array output:", error);
        return String(output);
      }
    };

    const normalizedExpected = normalizeArrayOutput(trimmedExpected);
    const normalizedActual = normalizeArrayOutput(trimmedActual);

    return normalizedExpected === normalizedActual;
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const formatDescription = (desc) => {
    if (!desc) return null;

    return desc.split("\n").map((line, index) => {
      const trimmedLine = line.trim();
      const isExample = trimmedLine.toLowerCase().startsWith("example");
      const isConstraint = trimmedLine.toLowerCase().startsWith("constraints");
      const isInput = trimmedLine.toLowerCase().startsWith("input:");
      const isOutput = trimmedLine.toLowerCase().startsWith("output:");
      const isBulletPoint = trimmedLine.startsWith("•");

      const className = `mb-2 ${
        isDarkMode
          ? isExample
            ? "text-blue-400"
            : isConstraint
            ? "text-purple-400"
            : isInput
            ? "text-emerald-400"
            : isOutput
            ? "text-orange-400"
            : isBulletPoint
            ? "text-gray-300"
            : "text-gray-200"
          : isExample
          ? "text-blue-600"
          : isConstraint
          ? "text-purple-600"
          : isInput
          ? "text-emerald-600"
          : isOutput
          ? "text-orange-600"
          : isBulletPoint
          ? "text-gray-600"
          : "text-gray-800"
      } ${
        isExample || isConstraint
          ? "font-semibold text-lg mt-4"
          : isInput || isOutput
          ? "font-medium ml-4"
          : isBulletPoint
          ? "ml-6"
          : ""
      }`;

      return (
        <p key={index} className={className}>
          {trimmedLine}
        </p>
      );
    });
  };

  useEffect(() => {
    console.log("State Update:", {
      currentProblemIndex,
      code,
      codeStore,
    });
  }, [currentProblemIndex, code, codeStore]);

  // When language changes, load language-specific stored code
  useEffect(() => {
    const stored = getStoredCode(currentProblemIndex, selectedLanguage);
    if (stored && stored.trim() !== "") {
      setCode(stored);
    } else {
      setCode(DEFAULT_SNIPPETS[selectedLanguage] || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  const handleProblemChange = (newIndex) => {
    console.log("Handle problem change");
    console.log("newIndex:", newIndex);

    if (newIndex < 0 || newIndex >= problems.length) return;

    // Save current code for current problem and language
    setStoredCode(currentProblemIndex, selectedLanguage, code || "");

    // Reset states before changing problem
    setOutput("");
    setError(null);
    setTestCaseResults([]); // Reset test case results

    // Update the current problem index
    setCurrentProblemIndex(newIndex);

    // Load code for the new problem and current language
    const stored = getStoredCode(newIndex, selectedLanguage);
    setCode(stored && stored.trim() !== "" ? stored : (DEFAULT_SNIPPETS[selectedLanguage] || ""));
  };

  useEffect(() => {
    console.log("Problems array:", problems);
    if (!Array.isArray(problems)) {
      console.error("Problems is not an array:", problems);
    }
  }, [problems]);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
    document.body.classList.toggle("light", !isDarkMode);
  }, [isDarkMode]);

  if (showLoginForm) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-[#0D0D0D] pt-20 pb-10 px-4 overflow-hidden">
        <div className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden relative shadow-2xl">
          
          {/* Glowing accent elements */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
          <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
          <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>
  
          {/* Header */}
          <div className="bg-[#1A1A1A] border-b border-[#333333] px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#00BFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_#00BFFF]"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M5 10v4h14v-4" />
                <line x1="8" y1="10" x2="8" y2="14" />
                <line x1="12" y1="10" x2="12" y2="14" />
                <line x1="16" y1="10" x2="16" y2="14" />
              </svg>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
                Technical Round
              </span>
            </h2>
            <p className="text-sm text-center text-gray-400 mt-1">
              Please enter your details to start the technical round
            </p>
          </div>
  
          {/* Body */}
          <div className="p-6">
            {loginError && (
              <div className="mb-6 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-red-400 mr-3"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12" y2="17" />
                  </svg>
                  <span className="text-red-300">{loginError}</span>
                </div>
              </div>
            )}
  
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#00BFFF]">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BFFF] focus:border-transparent"
                />
              </div>
  
              {/* User ID Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#00FF99]">
                  User ID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                  className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FF99] focus:border-transparent"
                />
              </div>
  
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#B266FF]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#B266FF] focus:border-transparent"
                />
              </div>
  
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center"
                style={{
                  background: "linear-gradient(to right, #00BFFF, #1E90FF)",
                }}
              >
                Start Technical Round
              </button>
            </form>
          </div>
  
          {/* Footer Glow */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        Loading problems...
      </div>
    );
  }

  if (!problems || !Array.isArray(problems) || problems.length === 0) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        No problems found. Please contact support.
      </div>
    );
  }

  if (!problems.length) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        No problems found.
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex] || {};
  if (!currentProblem) {
    return null;
  }
  const handleSubmit = async () => {
    setSubmitIsRunning(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/checkTechSolution`, {
        title: currentProblem.title,
        desc: currentProblem.desc,
        code: code,
      });

      console.log(response);

      if (response.data.cleanedResponse.success) {
        currentlyScored += 1;
      }

      if (response.data) {
        setOutput(
          response.data.cleanedResponse.summary || "Evaluation successful"
        );
        setError(null);
      } else {
        setError(response.data.error);
        setOutput("");
      }

      console.log(`Solved problems count: ${currentlyScored}`);
    } catch (error) {
      console.error(error);
      setError("An error occurred while executing the code");
      setOutput("");
    } finally {
      setSubmitIsRunning(false);
    }
  };

  const renderTestCases = () => {
    const currentProblem = problems[currentProblemIndex];

    if (
      !currentProblem?.testCases ||
      !Array.isArray(currentProblem.testCases) ||
      currentProblem.testCases.length === 0
    ) {
      return (
        <div
          className={`text-center py-8 ${
            isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}
        >
          No test cases available for this problem
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {currentProblem.testCases.map((testCase, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              isDarkMode
                ? "bg-gray-900/50 border-gray-700"
                : "bg-gray-50 border-gray-300"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className={`font-semibold ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Test Case {index + 1}
              </span>
              {testCaseResults[index] &&
                (testCaseResults[index].isCorrect ? (
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                ) : (
                  <XCircle className="text-red-500 h-5 w-5" />
                ))}
            </div>
            <div
              className={`mb-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <span className="font-medium">Input:</span>{" "}
              {String(testCase?.input || "")}
            </div>
            <div
              className={`mb-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <span className="font-medium">Expected:</span>{" "}
              {String(testCase?.expectedOutput || "")}
            </div>
            {testCaseResults[index] && (
              <div
                className={
                  testCaseResults[index].isCorrect
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                <span className="font-medium">Actual:</span>{" "}
                {String(testCaseResults[index].actualOutput || "")}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen min-w-full p-6 flex ${
        isDarkMode
          ? "bg-[#0D0D0D]"
          : "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200"
      }`}
    >
      <div className="grid grid-cols-2 gap-4 w-full h-[calc(100vh-2rem)]">
        {/* Left Panel */}
        <div
          className={`relative rounded-xl shadow-lg p-6 flex flex-col overflow-hidden ${
            isDarkMode
              ? "bg-[#1A1A1A] border border-[#333333]"
              : "bg-white/90 border border-gray-200"
          }`}
        >
          {/* Problem Navigation and Theme Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {/* Existing navigation buttons */}
              <button
                onClick={handleEndSession}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isDarkMode
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-red-700 hover:bg-red-800 text-white"
                }`}
              >
                End Session
              </button>
              {/* Timer Display */}
              <div
                className={`flex items-center px-4 py-2 rounded-full ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-200"
                    : "bg-gray-200 text-gray-800"
                } ${remainingTime <= 60 ? "animate-pulse text-red-500" : ""}`}
              >
                <Clock className="mr-2 h-5 w-5" />
                <span className="font-mono text-sm">
                  {formatTime(remainingTime)}
                </span>
              </div>
              <button
                onClick={() => handleProblemChange(currentProblemIndex - 1)}
                disabled={currentProblemIndex === 0}
                className={`p-2 rounded-full ${
                  currentProblemIndex === 0
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                }`}
              >
                <ChevronLeft
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                />
              </button>

              <span
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Problem {currentProblemIndex + 1} of {problems.length}
              </span>

              <button
                onClick={() => handleProblemChange(currentProblemIndex + 1)}
                disabled={currentProblemIndex === problems.length - 1}
                className={`p-2 rounded-full ${
                  currentProblemIndex === problems.length - 1
                    ? "opacity-50 cursor-not-allowed"
                    : isDarkMode
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                }`}
              >
                <ChevronRight
                  className={isDarkMode ? "text-gray-300" : "text-gray-600"}
                />
              </button>
            </div>

            {/* Timer and Theme Toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-full shadow-lg transition-all duration-300 ${
                  isDarkMode
                    ? "bg-[#222222] hover:bg-[#2A2A2A] text-yellow-400"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <h1
            className={`text-3xl font-bold mb-4 ${
              isDarkMode
                ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white"
                : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
            }`}
          >
            {currentProblem.title}
          </h1>
          <div className="prose max-w-none overflow-y-auto pr-2 text-gray-300">
            {formatDescription(currentProblem.desc)}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4 h-full">
          {/* Code Editor */}
          <div
            className={`rounded-xl shadow-lg p-6 flex-1 flex flex-col ${
              isDarkMode
                ? "bg-[#1A1A1A] border border-[#333333]"
                : "bg-white/90 border border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  // Persist current code for current language and problem
                  setStoredCode(currentProblemIndex, selectedLanguage, code || "");
                  setSelectedLanguage(e.target.value);
                }}
                className={`w-48 p-2 rounded-md ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-200"
                    : "bg-gray-100 border-gray-300 text-gray-800"
                }`}
              >
                {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSubmit}
                disabled={isSubmitRunning}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isDarkMode
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                }`}
              >
                <Play className="h-4 w-4" />
                {isSubmitRunning ? "Submitting..." : "Submit"}
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  isDarkMode
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                }`}
              >
                <Play className="h-4 w-4" />
                {isRunning ? "Running..." : "Run Code"}
              </button>
            </div>
            <div
              className={`rounded-lg overflow-hidden flex-1 ${
                isDarkMode
                  ? "border border-[#333333] bg-[#0F0F0F]"
                  : "border border-gray-300 bg-gray-50"
              }`}
            >
              <Editor
                height="100%"
                language={MONACO_LANGUAGE_MAP[selectedLanguage] || "plaintext"}
                theme={isDarkMode ? "vs-dark" : "light"}
                value={code}
                onChange={(value) => {
                  const text = value ?? "";
                  setCode(text);
                  setStoredCode(currentProblemIndex, selectedLanguage, text);
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: { other: true, comments: true, strings: true },
                  tabSize: 2,
                }}
                onMount={(editor, monaco) => {
                  const snippetByLang = {
                    javascript: `function solve() {
  // TODO: implement your logic
  return "";
}
console.log(solve());`,
                    python: `def solve():
    # TODO: implement your logic
    return ""

if __name__ == "__main__":
    print(solve())`,
                    java: `static String solve() {
  // TODO: implement your logic
  return "";
}`,
                    cpp: `string solve() {
  // TODO: implement your logic
  return "";
}`,
                    c: `const char* solve() {
  // TODO: implement your logic
  return "";
}`,
                    go: `func solve() string {
  // TODO: implement your logic
  return ""
}`,
                    ruby: `def solve
  # TODO: implement your logic
  ""
end`,
                    rust: `fn solve() -> String {
    // TODO: implement your logic
    "".to_string()
}`,
                    php: `function solve() {
  // TODO: implement your logic
  return "";
}`,
                  };

                  const languages = Object.values(MONACO_LANGUAGE_MAP);
                  languages.forEach((lang) => {
                    try {
                      monaco.languages.registerCompletionItemProvider(lang, {
                        triggerCharacters: [".", "(", "["],
                        provideCompletionItems: () => {
                          const solveSnippet = snippetByLang[lang] || "";
                          const suggestions = [
                            {
                              label: "solve",
                              kind: monaco.languages.CompletionItemKind.Snippet,
                              insertTextRules:
                                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              insertText: solveSnippet,
                              documentation: "Insert solve() scaffold",
                            },
                            {
                              label: "print",
                              kind: monaco.languages.CompletionItemKind.Snippet,
                              insertTextRules:
                                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                              insertText:
                                lang === "python"
                                  ? "print(${1:value})"
                                  : lang === "javascript"
                                  ? "console.log(${1:value});"
                                  : lang === "java"
                                  ? "System.out.println(${1:value});"
                                  : lang === "cpp"
                                  ? "cout << ${1:value};"
                                  : lang === "c"
                                  ? "printf(\"%s\", ${1:value});"
                                  : lang === "go"
                                  ? "fmt.Println(${1:value})"
                                  : lang === "ruby"
                                  ? "puts ${1:value}"
                                  : lang === "rust"
                                  ? "println!(\"{}\", ${1:value});"
                                  : lang === "php"
                                  ? "echo ${1:value};"
                                  : "${1:value}",
                              documentation: "Quick print",
                            },
                          ];
                          return { suggestions };
                        },
                      });
                    } catch {
                      // ignore if a language is not available in Monaco
                    }
                  });

                  // Seed default code if empty on first mount
                  if (!editor.getValue()) {
                    editor.setValue(DEFAULT_SNIPPETS[selectedLanguage] || "");
                  }
                }}
              />
            </div>
          </div>

          {/* Output and Test Cases Panel */}
          <div className="flex gap-4 h-[250px]">
            {/* Output Panel */}
            <div
            className={`w-1/2 rounded-xl shadow-lg p-6 ${
                isDarkMode
                  ? "bg-[#1A1A1A] border border-[#333333]"
                  : "bg-white/90 border border-gray-200"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  isDarkMode
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600"
                }`}
              >
                Output
              </h2>

              {error && (
                <div
                  className={`mb-4 p-4 rounded-lg ${
                    isDarkMode
                      ? "bg-red-900/50 border-red-700"
                      : "bg-red-100 border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    <AlertCircle
                      className={`h-4 w-4 ${
                        isDarkMode ? "text-red-400" : "text-red-600"
                      }`}
                    />
                    <div
                      className={`ml-2 font-semibold ${
                        isDarkMode ? "text-red-400" : "text-red-600"
                      }`}
                    >
                      Error
                    </div>
                  </div>
                  <div
                    className={`mt-2 ${
                      isDarkMode ? "text-red-200" : "text-red-700"
                    }`}
                  >
                    {error}
                  </div>
                </div>
              )}

              <pre
                className={`p-4 rounded-lg h-32 overflow-auto font-mono text-sm ${
                  isDarkMode
                    ? "bg-[#0F0F0F] border border-[#333333] text-gray-200"
                    : "bg-gray-50 border border-gray-300 text-gray-800"
                }`}
                style={{
                  whiteSpace: "normal",
                  overflowWrap: "break-word",
                }}
              >
                {output || "Run your code to see the output here..."}
              </pre>
            </div>

            {/* Test Cases Panel */}
            <div
            className={`w-1/2 rounded-xl shadow-lg p-6 overflow-auto ${
                isDarkMode
                  ? "bg-[#1A1A1A] border border-[#333333]"
                  : "bg-white/90 border border-gray-200"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  isDarkMode
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
                }`}
              >
                Manual Test Cases
              </h2>

              {renderTestCases()}
            </div>
          </div>
        </div>
      </div>

      {showCheatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Cheating Detected
            </h2>
            <p className="mb-6">
              You have been detected switching tabs or minimizing the browser
              during the technical round.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  // Redirect to exit page or close the application
                  window.location.reload();
                  window.exit();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Exit, You have been rejected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechRound;
