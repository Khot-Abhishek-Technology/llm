import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import sendEmail from "../components/email";
import axios from "axios";

export default function HRRoundInfo() {
  const [isInstructionsRead, setIsInstructionsRead] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const [candidatesEmail, setCandidatesEmails] = useState([]);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const VITE_FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;

  const handleProceed = () => {
    if (isInstructionsRead) {
      handleSendEmails();
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        navigate("/dashboard");
      }, 1700);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.error("No userId found in localStorage.");
          return;
        }

        const response = await axios.get(
          `${BACKEND_URL}/getUserInfo/${userId}`
        );
        console.log("Dashboard data:", response.data);

        const emails =
          response.data.candidateData?.map((candidate) => candidate.email) ||
          [];
        setCandidatesEmails(emails);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSendEmails = async () => {
    const candidateData = candidatesEmail;
    console.log("Emails to be sent: ", candidateData);

    const companyName = localStorage.getItem("companyName") || "Your Company";
    const HRemail = localStorage.getItem("email") || "hr@yourcompany.com";

    const aptitudeDuration = localStorage.getItem("aptitudeDuration");
    const technicalDuration = localStorage.getItem("technicalDuration");

    if (candidateData.length === 0) {
      alert("No candidate data found in localStorage");
      return;
    }

    const duration = aptitudeDuration || technicalDuration;
    const testType = aptitudeDuration
      ? "Aptitude Test with Reasoning"
      : "Technical Test";
    const testLink = aptitudeDuration
      ? `${VITE_FRONTEND_URL}/quizRound`
      : `${VITE_FRONTEND_URL}/techRound`;
    const subject = `${testType} Invitation for ${companyName}`;

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      for (const email of candidateData) {
        const templateParams = {
          candidateName: "Candidate",
          user_id: localStorage.getItem("userId"),
          companyName,
          dateAndTime: "12th Dec 2024, 10:00 AM",
          duration: duration || "60",
          testLink,
          hr_email: HRemail,
          to_email: email,
          subject,
          roundName: testType,
        };

        try {
          await sendEmail(templateParams);
          console.log(`Email sent successfully to ${email}`);
        } catch (error) {
          console.error(`Error sending email to ${email}:`, error);
        }

        await delay(800);
      }

      alert("All emails sent successfully.");
    } catch (error) {
      console.error("Error sending emails:", error);
      alert("An error occurred while sending emails. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-6">
      <div className="w-full max-w-3xl bg-[#1A1A1A] rounded-xl border border-[#333333] overflow-hidden relative shadow-2xl">
        {/* Glowing accent elements */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
        <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>

        {/* Header */}
        <div className="bg-[#1A1A1A] border-b border-[#333333] px-6 py-4">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
              HR Round Instructions
            </span>
          </h1>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Instructions Box */}
          <div className="bg-[#222222] border border-[#333333] p-4 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#00FF99] to-transparent"></div>
            <h3 className="text-base font-bold mb-2 text-[#00FF99] flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="#00FF99"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Important Instructions:
            </h3>
            <ul className="space-y-3 pl-5 text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 text-[#00FF99]">→</span>
                Both you and the candidate will receive an interview key and a
                link via email at the scheduled time.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#00FF99]">→</span>
                Open the provided link and enter the interview key.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#00FF99]">→</span>
                Once both parties have joined, the interview will begin.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#00FF99]">→</span>
                After the interview is completed, the recruiter will decide
                whether the candidate is selected or not.
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-[#00FF99]">→</span>
                Based on the recruiter's decision, a response will be sent to
                the candidate via email.
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="instructions-read"
              checked={isInstructionsRead}
              onChange={() => setIsInstructionsRead(!isInstructionsRead)}
              className="mr-3 w-5 h-5 text-[#00BFFF] focus:ring-[#00BFFF] border-gray-500 rounded bg-[#0D0D0D] glow-blue-sm"
            />
            <label
              htmlFor="instructions-read"
              className="text-gray-300 font-medium"
            >
              I have read and understood the HR Round Instructions
            </label>
          </div>

          {/* Button */}
          <button
            onClick={handleProceed}
            disabled={!isInstructionsRead}
            className={`w-full py-3 px-8 rounded-lg transition-all text-lg font-semibold ${
              isInstructionsRead
                ? "bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white hover:from-[#1E90FF] hover:to-[#00BFFF] hover:shadow-[0_0_25px_#00BFFF] transform hover:scale-[1.02]"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            Proceed to Next Round
          </button>

          {/* Toast */}
          {showToast && (
            <div className="fixed top-4 right-4 bg-gradient-to-r from-[#00FF99] to-[#00CC77] text-white px-6 py-4 rounded-lg shadow-lg glow-green">
              HR Round Information
              <p className="text-sm mt-1">
                You have successfully proceeded to the next round.
              </p>
            </div>
          )}
        </div>

        {/* Footer Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
      </div>

      {/* Add global styles for glow effects */}
      <style jsx>{`
        .glow-blue {
          box-shadow: 0 0 10px rgba(0, 191, 255, 0.3);
        }
        .glow-blue-sm {
          box-shadow: 0 0 5px rgba(0, 191, 255, 0.3);
        }
        .glow-green {
          box-shadow: 0 0 15px rgba(0, 255, 153, 0.4);
        }
        .glow-purple {
          box-shadow: 0 0 15px rgba(178, 102, 255, 0.4);
        }
        .glow-orange {
          box-shadow: 0 0 15px rgba(255, 127, 80, 0.4);
        }
      `}</style>
    </div>
  );
}
