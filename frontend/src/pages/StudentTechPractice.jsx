import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Code,
  Play,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  Loader2,
  Clock,
  Target,
} from "lucide-react";

const StudentTechPractice = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
      navigate("/student-login");
      return;
    }

    fetchTechProblems();
    setStartTime(Date.now());
  }, [navigate]);

  useEffect(() => {
    let timer;
    if (startTime && !isCompleted) {
      timer = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [startTime, isCompleted]);

  const fetchTechProblems = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/getAvailableTechProblems`);
      if (response.data.success) {
        setProblems(response.data.problems);
        setResults(new Array(response.data.problems.length).fill(null));
      }
    } catch (error) {
      console.error("Error fetching tech problems:", error);
      alert("Failed to load coding problems");
    } finally {
      setLoading(false);
    }
  };

  const executeCode = async () => {
    setIsRunning(true);
    setOutput("");

    try {
      // Simple code execution simulation
      const result = `Code executed successfully!\nLanguage: ${language}\nCode length: ${code.length} characters`;
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const submitSolution = async () => {
    if (!code.trim()) {
      alert("Please write some code before submitting!");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentProblem = problems[currentProblemIndex];
      const response = await axios.post(`${BACKEND_URL}/checkTechSolution`, {
        title: currentProblem.title,
        desc: currentProblem.description,
        code: code,
        language: language,
        timeSpentSeconds: Math.floor((Date.now() - startTime) / 1000),
        linesOfCode: code.split('\n').length,
      });

      if (response.data.success) {
        const evaluation = response.data.cleanedResponse;
        const analysis = response.data.analysis || {};
        
        const result = {
          problemId: currentProblem.id,
          title: currentProblem.title,
          code: code,
          language: language,
          evaluation: evaluation,
          analysis: analysis,
          isCorrect: evaluation.success || false,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
          submittedAt: new Date().toISOString(),
        };

        const newResults = [...results];
        newResults[currentProblemIndex] = result;
        setResults(newResults);

        // Move to next problem or complete
        if (currentProblemIndex < problems.length - 1) {
          setCurrentProblemIndex(currentProblemIndex + 1);
          setCode("");
          setOutput("");
        } else {
          // All problems completed
          await submitAllResults(newResults);
        }
      }
    } catch (error) {
      console.error("Error submitting solution:", error);
      alert("Failed to submit solution. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAllResults = async (finalResults) => {
    try {
      const studentId = localStorage.getItem("studentId");
      const solutions = finalResults.map(result => ({
        problemId: result.problemId,
        title: result.title,
        code: result.code,
        language: result.language,
        timeSpent: result.timeSpent,
      }));

      const response = await axios.post(`${BACKEND_URL}/submitStudentTechTest`, {
        studentId,
        solutions,
        timeSpent: timeSpent,
      });

      if (response.data.success) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error("Error submitting final results:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (isCorrect) => {
    return isCorrect ? "text-green-400" : "text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#00BFFF] mx-auto mb-4" size={48} />
          <p className="text-gray-300">Loading coding problems...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const correctSolutions = results.filter(r => r && r.isCorrect).length;
    const totalProblems = results.length;
    const percentage = Math.round((correctSolutions / totalProblems) * 100);

    return (
      <div className="min-h-screen bg-[#0D0D0D] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>

            <Target className="text-[#00BFFF] mx-auto mb-4" size={64} />
            <h1 className="text-3xl font-bold text-white mb-2">
              Coding Practice Completed!
            </h1>
            <p className="text-gray-400 mb-6">Here are your results</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Problems Solved</p>
                <p className={`text-2xl font-bold ${getScoreColor(correctSolutions > 0)}`}>
                  {correctSolutions}/{totalProblems}
                </p>
              </div>
              <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Success Rate</p>
                <p className={`text-2xl font-bold ${getScoreColor(percentage >= 50)}`}>
                  {percentage}%
                </p>
              </div>
              <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Time Spent</p>
                <p className="text-2xl font-bold text-white">
                  {formatTime(timeSpent)}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Code className="mr-3 text-[#00BFFF]" />
              Solution Review
            </h2>

            <div className="space-y-6">
              {results.map((result, index) => (
                result && (
                  <div key={index} className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-white font-medium flex-1">
                        Problem {index + 1}: {result.title}
                      </h3>
                      {result.isCorrect ? (
                        <CheckCircle className="text-green-400 ml-4" size={20} />
                      ) : (
                        <XCircle className="text-red-400 ml-4" size={20} />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="text-sm">
                        <span className="text-gray-400">Language: </span>
                        <span className="text-white">{result.language}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Time Spent: </span>
                        <span className="text-white">{formatTime(result.timeSpent)}</span>
                      </div>
                    </div>

                    {result.evaluation && (
                      <div className="bg-[#333333] border border-[#444444] rounded-lg p-3 mt-3">
                        <p className="text-gray-300 text-sm">
                          <strong className="text-[#00BFFF]">Evaluation:</strong>{" "}
                          {result.evaluation.summary || "Solution evaluated"}
                        </p>
                      </div>
                    )}

                    {result.analysis && result.analysis.potential_improvements && (
                      <div className="bg-[#2a1a0d] border border-[#4a3a1d] rounded-lg p-3 mt-3">
                        <p className="text-orange-300 text-sm">
                          <strong className="text-[#FF7F50]">Improvements:</strong>{" "}
                          {result.analysis.potential_improvements.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/student-dashboard")}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white rounded-lg hover:from-[#0099cc] hover:to-[#1a7fcc] transition-all"
            >
              <Home className="mr-2" size={20} />
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-[#00FF99] to-[#00cc7a] text-[#0D0D0D] rounded-lg hover:from-[#00cc7a] hover:to-[#00a566] transition-all font-bold"
            >
              Practice More
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!problems.length) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center text-gray-300">
          <p>No coding problems available</p>
          <button 
            onClick={() => navigate("/student-dashboard")}
            className="mt-4 px-4 py-2 bg-[#00BFFF] text-white rounded-lg hover:bg-[#0099cc]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentProblem = problems[currentProblemIndex];
  const progress = ((currentProblemIndex + 1) / problems.length) * 100;

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-white">Coding Practice</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-[#00BFFF]">
                <Clock className="mr-2" size={20} />
                <span className="font-mono text-lg">
                  {formatTime(timeSpent)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
            <span>
              Problem {currentProblemIndex + 1} of {problems.length}
            </span>
            <span>{Math.round(progress)}% Complete</span>
          </div>

          <div className="bg-[#333333] rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problem Description */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {currentProblem.title}
            </h2>
            <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
              {currentProblem.description}
            </div>
          </div>

          {/* Code Editor */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Solution</h2>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#222222] border border-[#333333] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-4 bg-[#222222] border border-[#333333] text-white font-mono text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BFFF] resize-none"
              placeholder="Write your solution here..."
            />

            <div className="flex space-x-4 mt-4">
              <button
                onClick={executeCode}
                disabled={isRunning}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-[#B266FF] to-[#9933ff] text-white rounded-lg hover:from-[#9933ff] hover:to-[#8000ff] transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <Play className="mr-2" size={16} />
                )}
                {isRunning ? "Running..." : "Test Code"}
              </button>

              <button
                onClick={submitSolution}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-[#00FF99] to-[#00cc7a] text-[#0D0D0D] rounded-lg hover:from-[#00cc7a] hover:to-[#00a566] transition-all font-bold disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <CheckCircle className="mr-2" size={16} />
                )}
                {isSubmitting ? "Submitting..." : "Submit Solution"}
              </button>
            </div>

            {/* Output */}
            {output && (
              <div className="mt-4">
                <h3 className="text-white font-medium mb-2">Output:</h3>
                <pre className="bg-[#222222] border border-[#333333] p-4 rounded-lg text-gray-300 text-sm overflow-auto max-h-32">
                  {output}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => {
              if (currentProblemIndex > 0) {
                setCurrentProblemIndex(currentProblemIndex - 1);
                setCode("");
                setOutput("");
              }
            }}
            disabled={currentProblemIndex === 0}
            className="flex items-center px-6 py-3 bg-[#222222] border border-[#333333] text-white rounded-lg hover:bg-[#2a2a2a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="mr-2" size={20} />
            Previous
          </button>

          <button
            onClick={() => navigate("/student-dashboard")}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Exit Practice
          </button>

          {currentProblemIndex < problems.length - 1 && (
            <button
              onClick={() => {
                setCurrentProblemIndex(currentProblemIndex + 1);
                setCode("");
                setOutput("");
              }}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white rounded-lg hover:from-[#0099cc] hover:to-[#1a7fcc] transition-all"
            >
              Skip Problem
              <ArrowRight className="ml-2" size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTechPractice;