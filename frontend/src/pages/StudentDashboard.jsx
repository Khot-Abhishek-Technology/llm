import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  BookOpen,
  Code,
  TrendingUp,
  Award,
  Clock,
  Target,
  Brain,
  Lightbulb,
  Play,
  BarChart3,
  LogOut,
  Loader2,
} from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    const isStudent = localStorage.getItem("isStudent");
    
    if (!studentId || !isStudent) {
      navigate("/student-login");
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const studentId = localStorage.getItem("studentId");
      const response = await axios.get(`${BACKEND_URL}/getStudentDashboard/${studentId}`);
      
      if (response.data.success) {
        setDashboardData(response.data.data);
        setStudentName(response.data.data.student.name || "");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async (questionType = "aptitude") => {
    setGeneratingQuestions(true);
    try {
      const studentId = localStorage.getItem("studentId");
      const response = await axios.post(`${BACKEND_URL}/generatePersonalizedQuestions`, {
        studentId,
        questionType,
        count: 5
      });

      if (response.data.success) {
        alert(`Generated ${response.data.questions.length} personalized questions!`);
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleUpdateName = async () => {
    try {
      const studentId = localStorage.getItem("studentId");
      const response = await axios.put(`${BACKEND_URL}/updateStudentProfile`, {
        studentId,
        name: studentName
      });

      if (response.data.success) {
        localStorage.setItem("studentName", studentName);
        setEditingName(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error updating name:", error);
      alert("Failed to update name");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("studentId");
    localStorage.removeItem("studentEmail");
    localStorage.removeItem("studentName");
    localStorage.removeItem("isStudent");
    navigate("/student-login");
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#00BFFF] mx-auto mb-4" size={48} />
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center text-gray-300">
          <p>Failed to load dashboard data</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-[#00BFFF] text-white rounded-lg hover:bg-[#0099cc]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#1A1A1A] rounded-xl border border-[#333333] p-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00BFFF] to-[#1E90FF] rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  {editingName ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="bg-[#222222] border border-[#333333] text-white px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
                        placeholder="Enter your name"
                      />
                      <button
                        onClick={handleUpdateName}
                        className="px-3 py-1 bg-[#00FF99] text-[#0D0D0D] rounded-lg hover:bg-[#00cc7a] font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold text-white">
                        {studentName || "Student"}
                      </h1>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-[#00BFFF] hover:text-[#0099cc] text-sm"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
                <p className="text-gray-400">{dashboardData.student.email}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="text-[#00FF99] mr-2" size={16} />
                  <span className="text-[#00FF99] font-medium">
                    Overall Progress: {dashboardData.student.overallProgress}%
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              <LogOut className="mr-2" size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00BFFF] to-transparent"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tests</p>
                <p className="text-2xl font-bold text-white">{dashboardData.performance.totalTests}</p>
              </div>
              <BookOpen className="text-[#00BFFF]" size={32} />
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00FF99] to-transparent"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(dashboardData.performance.averageScore)}`}>
                  {dashboardData.performance.averageScore}%
                </p>
              </div>
              <Award className="text-[#00FF99]" size={32} />
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#B266FF] to-transparent"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Aptitude Tests</p>
                <p className="text-2xl font-bold text-white">{dashboardData.performance.testsByType.aptitude}</p>
              </div>
              <Brain className="text-[#B266FF]" size={32} />
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#FF7F50] to-transparent"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Technical Tests</p>
                <p className="text-2xl font-bold text-white">{dashboardData.performance.testsByType.technical}</p>
              </div>
              <Code className="text-[#FF7F50]" size={32} />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Play className="mr-3 text-[#00BFFF]" />
                Quick Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/student-quiz")}
                  className="p-4 bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] rounded-lg text-white hover:from-[#0099cc] hover:to-[#1a7fcc] transition-all group"
                >
                  <BookOpen className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <p className="font-medium">Take Aptitude Quiz</p>
                  <p className="text-sm opacity-90">Practice reasoning & aptitude</p>
                </button>

                <button
                  onClick={() => navigate("/student-tech")}
                  className="p-4 bg-gradient-to-r from-[#B266FF] to-[#9933ff] rounded-lg text-white hover:from-[#9933ff] hover:to-[#8000ff] transition-all group"
                >
                  <Code className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <p className="font-medium">Practice Coding</p>
                  <p className="text-sm opacity-90">Practice programming skills</p>
                </button>

                <button
                  onClick={() => handleGenerateQuestions("aptitude")}
                  disabled={generatingQuestions}
                  className="p-4 bg-gradient-to-r from-[#00FF99] to-[#00cc7a] text-[#0D0D0D] rounded-lg hover:from-[#00cc7a] hover:to-[#00a566] transition-all group disabled:opacity-50"
                >
                  {generatingQuestions ? (
                    <Loader2 className="mb-2 animate-spin" size={24} />
                  ) : (
                    <Lightbulb className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                  )}
                  <p className="font-medium">Get AI Suggestions</p>
                  <p className="text-sm opacity-90">Personalized questions</p>
                </button>

                <button
                  onClick={() => navigate("/student-suggested")}
                  className="p-4 bg-gradient-to-r from-[#FF7F50] to-[#ff6347] rounded-lg text-white hover:from-[#ff6347] hover:to-[#ff4500] transition-all group"
                >
                  <Target className="mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <p className="font-medium">AI Suggestions</p>
                  <p className="text-sm opacity-90">AI-recommended practice</p>
                </button>
              </div>
            </div>

            {/* Recent Test Results */}
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="mr-3 text-[#00FF99]" />
                Recent Test Results
              </h2>
              
              {dashboardData.performance.recentTests.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.performance.recentTests.map((test, index) => (
                    <div key={index} className="bg-[#222222] border border-[#333333] rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-3">
                          {test.testType === 'aptitude' ? (
                            <Brain className="text-[#00BFFF]" size={20} />
                          ) : (
                            <Code className="text-[#B266FF]" size={20} />
                          )}
                          <span className="font-medium text-white capitalize">
                            {test.testType} Test
                          </span>
                        </div>
                        <span className={`font-bold ${getScoreColor((test.score / test.maxScore) * 100)}`}>
                          {test.score}/{test.maxScore}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-400">
                        <span>{new Date(test.completedAt).toLocaleDateString()}</span>
                        <span>{Math.round((test.score / test.maxScore) * 100)}%</span>
                      </div>
                      
                      <div className="mt-2 bg-[#333333] rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor((test.score / test.maxScore) * 100)}`}
                          style={{ width: `${(test.score / test.maxScore) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="mx-auto mb-4 opacity-50" size={48} />
                  <p>No tests taken yet</p>
                  <p className="text-sm">Start with a quiz or coding challenge!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Performance Analysis */}
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <TrendingUp className="mr-3 text-[#00BFFF]" />
                Performance Analysis
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-[#00FF99] font-medium mb-2">Strengths</h3>
                  {dashboardData.performance.strengths.length > 0 ? (
                    <ul className="space-y-1">
                      {dashboardData.performance.strengths.map((strength, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center">
                          <div className="w-2 h-2 bg-[#00FF99] rounded-full mr-2"></div>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">Take more tests to identify strengths</p>
                  )}
                </div>

                <div>
                  <h3 className="text-[#FF7F50] font-medium mb-2">Areas for Improvement</h3>
                  {dashboardData.performance.weaknesses.length > 0 ? (
                    <ul className="space-y-1">
                      {dashboardData.performance.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center">
                          <div className="w-2 h-2 bg-[#FF7F50] rounded-full mr-2"></div>
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">Great! No major weaknesses identified</p>
                  )}
                </div>

                <div>
                  <h3 className="text-[#B266FF] font-medium mb-2">Recommended Topics</h3>
                  {dashboardData.performance.recommendedTopics.length > 0 ? (
                    <ul className="space-y-1">
                      {dashboardData.performance.recommendedTopics.map((topic, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-center">
                          <div className="w-2 h-2 bg-[#B266FF] rounded-full mr-2"></div>
                          {topic}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm">Keep practicing to get recommendations</p>
                  )}
                </div>
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <Lightbulb className="mr-3 text-[#00FF99]" />
                AI Suggestions
              </h2>
              
              {dashboardData.suggestedQuestions.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.suggestedQuestions.map((question, index) => (
                    <div key={index} className="bg-[#222222] border border-[#333333] rounded-lg p-3">
                      <p className="text-white text-sm font-medium mb-1">
                        {question.question.substring(0, 80)}...
                      </p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#B266FF]">{question.topic}</span>
                        <span className="text-gray-400">{question.difficulty}</span>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => navigate("/student-suggested")}
                    className="w-full mt-4 py-2 bg-gradient-to-r from-[#00FF99] to-[#00cc7a] text-[#0D0D0D] rounded-lg hover:from-[#00cc7a] hover:to-[#00a566] transition-all font-medium"
                  >
                    Practice All Suggestions
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <Lightbulb className="mx-auto mb-3 opacity-50" size={32} />
                  <p className="text-sm mb-3">No suggestions yet</p>
                  <button
                    onClick={() => handleGenerateQuestions("aptitude")}
                    disabled={generatingQuestions}
                    className="px-4 py-2 bg-[#00FF99] text-[#0D0D0D] rounded-lg hover:bg-[#00cc7a] transition-all font-medium disabled:opacity-50"
                  >
                    {generatingQuestions ? "Generating..." : "Generate Now"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;