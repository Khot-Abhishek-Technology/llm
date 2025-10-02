import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  Loader2,
  Clock,
  Lightbulb,
  Target,
} from "lucide-react";

const StudentSuggestedQuestions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
      navigate("/student-login");
      return;
    }

    fetchSuggestedQuestions();
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

  const fetchSuggestedQuestions = async () => {
    try {
      const studentId = localStorage.getItem("studentId");
      const response = await axios.get(
        `${BACKEND_URL}/getStudentDashboard/${studentId}`
      );

      if (response.data.success) {
        const suggestedQuestions = response.data.data.suggestedQuestions.filter(
          (q) => !q.completed
        );
        if (suggestedQuestions.length === 0) {
          // Generate new questions if none available
          await generateNewQuestions();
        } else {
          setQuestions(suggestedQuestions);
        }
      }
    } catch (error) {
      console.error("Error fetching suggested questions:", error);
      alert("Failed to load suggested questions");
    } finally {
      setLoading(false);
    }
  };

  const generateNewQuestions = async () => {
    try {
      const studentId = localStorage.getItem("studentId");
      const response = await axios.post(
        `${BACKEND_URL}/generatePersonalizedQuestions`,
        {
          studentId,
          questionType: "aptitude",
          count: 5,
        }
      );

      if (response.data.success) {
        setQuestions(response.data.questions);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions");
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitTest = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const studentId = localStorage.getItem("studentId");
      const answers = questions.map((question) => ({
        questionId: question.questionId,
        selectedAnswer: selectedAnswers[question.questionId] || "",
      }));

      const response = await axios.post(`${BACKEND_URL}/submitSuggestedTest`, {
        studentId,
        answers,
      });

      if (response.data.success) {
        setResults(response.data.results);
        setIsCompleted(true);
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "from-green-500 to-emerald-500";
    if (percentage >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="animate-spin text-[#00BFFF] mx-auto mb-4"
            size={48}
          />
          <p className="text-gray-300">Loading suggested questions...</p>
        </div>
      </div>
    );
  }

  if (isCompleted && results) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 mb-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>

            <Target className="text-[#00BFFF] mx-auto mb-4" size={64} />
            <h1 className="text-3xl font-bold text-white mb-2">
              Suggested Questions Completed!
            </h1>
            <p className="text-gray-400 mb-6">Here are your results</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Score</p>
                <p
                  className={`text-2xl font-bold ${getScoreColor(
                    results.percentage
                  )}`}
                >
                  {results.score}/{results.maxScore}
                </p>
              </div>
              <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Percentage</p>
                <p
                  className={`text-2xl font-bold ${getScoreColor(
                    results.percentage
                  )}`}
                >
                  {results.percentage}%
                </p>
              </div>
              <div className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                <p className="text-gray-400 text-sm">Time Taken</p>
                <p className="text-2xl font-bold text-white">
                  {formatTime(timeSpent)}
                </p>
              </div>
            </div>

            <div className="mt-6 bg-[#333333] rounded-full h-3">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(
                  results.percentage
                )}`}
                style={{ width: `${results.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Lightbulb className="mr-3 text-[#00BFFF]" />
              Question Review
            </h2>

            <div className="space-y-6">
              {results.questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-[#222222] border border-[#333333] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-medium flex-1">
                      Q{index + 1}. {question.question}
                    </h3>
                    {question.isCorrect ? (
                      <CheckCircle className="text-green-400 ml-4" size={20} />
                    ) : (
                      <XCircle className="text-red-400 ml-4" size={20} />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-400">Your answer: </span>
                      <span
                        className={
                          question.isCorrect ? "text-green-400" : "text-red-400"
                        }
                      >
                        {question.selectedAnswer.toUpperCase() ||
                          "Not answered"}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Correct answer: </span>
                      <span className="text-green-400">
                        {question.correctAnswer.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {question.explanation && (
                    <div className="bg-[#333333] border border-[#444444] rounded-lg p-3 mt-3">
                      <p className="text-gray-300 text-sm">
                        <strong className="text-[#00BFFF]">Explanation:</strong>{" "}
                        {question.explanation}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {question.youtubeLink}
                      </p>
                    </div>
                  )}
                </div>
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

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center text-gray-300">
          <Lightbulb className="mx-auto mb-4 opacity-50" size={48} />
          <p className="mb-4">No suggested questions available</p>
          <button
            onClick={() => navigate("/student-dashboard")}
            className="px-4 py-2 bg-[#00BFFF] text-white rounded-lg hover:bg-[#0099cc]"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-white">
              AI Suggested Questions
            </h1>
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
              Question {currentQuestionIndex + 1} of {questions.length}
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

        {/* Question */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-8">
          <div className="flex items-center mb-4">
            <Lightbulb className="text-[#00FF99] mr-3" size={24} />
            <div>
              <span className="text-[#00FF99] text-sm font-medium">
                {currentQuestion.difficulty?.toUpperCase()} •{" "}
                {currentQuestion.topic}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-medium text-white mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, value]) => (
              <button
                key={key}
                onClick={() =>
                  handleAnswerSelect(currentQuestion.questionId, key)
                }
                className={`w-full p-4 text-left rounded-lg border transition-all ${
                  selectedAnswers[currentQuestion.questionId] === key
                    ? "bg-[#0d2d39] border-[#00BFFF] text-white"
                    : "bg-[#222222] border-[#333333] text-gray-300 hover:border-[#00BFFF] hover:bg-[#2a2a2a]"
                }`}
              >
                <span className="font-medium mr-3">{key.toUpperCase()}.</span>
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-6 py-3 bg-[#222222] border border-[#333333] text-white rounded-lg hover:bg-[#2a2a2a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="mr-2" size={20} />
            Previous
          </button>

          <div className="flex space-x-4">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-[#00FF99] to-[#00cc7a] text-[#0D0D0D] rounded-lg hover:from-[#00cc7a] hover:to-[#00a566] transition-all font-bold disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Test
                    <CheckCircle className="ml-2" size={20} />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                className="flex items-center px-6 py-3 bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white rounded-lg hover:from-[#0099cc] hover:to-[#1a7fcc] transition-all"
              >
                Next
                <ArrowRight className="ml-2" size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-8 bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <h3 className="text-white font-medium mb-4">Question Navigator</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                  index === currentQuestionIndex
                    ? "bg-[#00BFFF] text-white"
                    : selectedAnswers[questions[index].questionId]
                    ? "bg-[#00FF99] text-[#0D0D0D]"
                    : "bg-[#222222] text-gray-400 hover:bg-[#333333]"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#00BFFF] rounded mr-2"></div>
              <span className="text-gray-400">Current</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#00FF99] rounded mr-2"></div>
              <span className="text-gray-400">Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-[#222222] border border-[#333333] rounded mr-2"></div>
              <span className="text-gray-400">Not Answered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSuggestedQuestions;
