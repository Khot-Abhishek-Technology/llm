import { useState } from "react";
import { Mail, Key, AlertTriangle, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

const StudentLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/sendOTP`, { email });
      if (response.data.success) {
        setOtpSent(true);
        setStep(2);
        setError("");
      }
    } catch (error) {
      console.error("Send OTP failed", error);
      setError(error.response?.data?.message || "Failed to send OTP!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/verifyOTP`, {
        email,
        otp,
      });
      if (response.data.success) {
        // Store student data in localStorage
        localStorage.setItem("studentEmail", response.data.student.email);
        localStorage.setItem("studentId", response.data.student.id);
        localStorage.setItem("studentName", response.data.student.name || "");
        localStorage.setItem("isStudent", "true");

        setEmail("");
        setOtp("");
        navigate("/student-dashboard");
      }
    } catch (error) {
      console.error("OTP verification failed", error);
      setError(error.response?.data?.message || "Invalid OTP!");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/sendOTP`, { email });
      setError("");
      alert("OTP resent successfully!");
    } catch (error) {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

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
            <Key className="text-[#00BFFF] drop-shadow-[0_0_8px_#00BFFF]" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00BFFF] to-[#1E90FF]">
              Student Portal
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {step === 1
              ? "Enter your email to receive OTP"
              : "Enter the OTP sent to your email"}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="text-red-400 mr-3" size={20} />
                <span className="text-red-300">{error}</span>
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#00BFFF]">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00BFFF] focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="text-center text-gray-400 mt-2">
                If already logged in,{" "}
                <a
                  href="/student-dashboard"
                  className="text-[#00BFFF] hover:text-[#1E90FF] underline"
                >
                  click here
                </a>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center"
                style={{
                  background: loading
                    ? "#666666"
                    : "linear-gradient(to right, #00BFFF, #1E90FF)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              {/* OTP */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#00FF99]">
                  Enter OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FF99] focus:border-transparent text-center text-2xl tracking-widest"
                    maxLength="6"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-lg font-bold text-white transition-all duration-300 flex items-center justify-center"
                style={{
                  background: loading
                    ? "#666666"
                    : "linear-gradient(to right, #00FF99, #00cc7a)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Verifying...
                  </>
                ) : (
                  "Verify & Login"
                )}
              </Button>
              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-[#B266FF] hover:text-[#9933ff] font-medium focus:outline-none disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
              {/* Back to email */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setError("");
                  }}
                  className="text-gray-400 hover:text-white font-medium focus:outline-none"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Glow */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
      </div>
    </div>
  );
};

export default StudentLogin;
