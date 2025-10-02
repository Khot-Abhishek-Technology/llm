import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, User, UserRound } from "lucide-react";
// import Button from "./Button";

function HRRoundEntrance() {
  const navigate = useNavigate();
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");

  const submitHandler = () => {
    localStorage.setItem("candidateEmailForMeet", candidateEmail);
    if (recruiterEmail && recruiterEmail.includes("@")) {
      navigate(`/hrRound/${recruiterEmail}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      submitHandler();
    }
  };

  useEffect(() => {
    const storedCandidateEmail = localStorage.getItem(
      "interviewCandidateEmail"
    );
    const storedRecruiterEmail = localStorage.getItem(
      "interviewRecruiterEmail"
    );
    if (storedCandidateEmail) {
      setCandidateEmail(storedCandidateEmail);
    }
    if (storedRecruiterEmail) {
      setRecruiterEmail(storedRecruiterEmail);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-start justify-center bg-[#0D0D0D] pt-20 pb-10 px-4 overflow-hidden">
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden relative shadow-2xl">
        {/* Glowing accents */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
        <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>

        {/* Header */}
        <div className="bg-[#1A1A1A] border-b border-[#333333] px-6 py-5 text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2 text-white">
            <UserRound className="text-[#00BFFF] drop-shadow-[0_0_8px_#00BFFF]" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
              HR Interview Setup
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Enter recruiter and candidate details
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Recruiter Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#00BFFF] mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              You are conducting the interview as:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={recruiterEmail}
                onChange={(e) => setRecruiterEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Recruiter Email"
                className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent
                  ${
                    recruiterEmail && recruiterEmail.includes("@")
                      ? "border-[#00FF99] focus:ring-[#00FF99]"
                      : "border-[#333333] focus:ring-[#00BFFF]"
                  }`}
              />
            </div>
          </div>

          {/* Candidate Section */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[#00FF99] mb-2 flex items-center">
              <UserRound className="w-4 h-4 mr-2" />
              You are interviewing:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Candidate Email"
                className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent
                  ${
                    candidateEmail && candidateEmail.includes("@")
                      ? "border-[#00FF99] focus:ring-[#00FF99]"
                      : "border-[#333333] focus:ring-[#00BFFF]"
                  }`}
              />
            </div>
          </div>

          <button
            onClick={submitHandler}
            disabled={!recruiterEmail || !recruiterEmail.includes("@")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center"
            style={{
              background:
                !recruiterEmail || !recruiterEmail.includes("@")
                  ? "#666666"
                  : "linear-gradient(to right, #00BFFF, #1E90FF)",
            }}
          >
            Start Interview
            <ArrowRight
              className={`ml-2 transition-transform duration-300 
                ${
                  isHovered && recruiterEmail && recruiterEmail.includes("@")
                    ? "translate-x-1"
                    : ""
                }`}
            />
          </button>

          {recruiterEmail && !recruiterEmail.includes("@") && (
            <div className="mt-4 p-3 bg-red-900/30 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="text-red-400 mr-3" size={20} />
                <span className="text-red-300">
                  Please enter a valid email address
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
      </div>
    </div>
  );
}

export default HRRoundEntrance;
