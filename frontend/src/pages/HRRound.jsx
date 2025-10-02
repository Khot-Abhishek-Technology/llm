import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { Mail, Copy, AlertCircle, Check, Loader2 } from "lucide-react";
import axios from "axios";
import sendMeetInvitation from "../components/MeetInvitation";

export default function HRRound() {
  const { id, candidateEmail } = useParams();
  const roomID = id;
  const meetingContainerRef = useRef(null);
  const [sent, setSent] = useState(false);
  const [companyName, setcompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const fetchCandidateData = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/getUserInfo/${userId}`
        );
        setcompanyName(response.data.companyName);
      } catch (error) {
        console.error("Error fetching candidate data:", error);
      }
    };

    fetchCandidateData();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const sendMeetingLink = async () => {
    setLoading(true);
    const meetingLink = `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomID}`;

    const templateParams = {
      meet_link: meetingLink,
      company_name: companyName,
      to_email: localStorage.getItem("candidateEmailForMeet"),
    };

    try {
      await sendMeetInvitation(templateParams);
      showNotification(
        "Email successfully sent to the candidate. They can now join the meeting."
      );
      setSent(true);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      showNotification("Failed to send email. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyMeetingLink = () => {
    const meetingLink = `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomID}`;
    navigator.clipboard.writeText(meetingLink);
    showNotification("Meeting link copied to clipboard!");
  };

  useEffect(() => {
    if (meetingContainerRef.current) {
      const appID = 1797022755;
      const serverSecret = "11e2b39925f1235aa507b23db473132c";
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomID,
        Date.now().toString(),
        "Enter your name"
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: meetingContainerRef.current,
        sharedLinks: [
          {
            name: "Copy link",
            url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomID}`,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
      });

      // Automatically trigger sendMeetingLink when the component mounts
      sendMeetingLink();
    }
  }, [roomID]);

  return (
    <div className="relative h-screen bg-[#0D0D0D]">
      {/* Glowing accents */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00BFFF] to-[#1E90FF]"></div>
      <div className="absolute top-10 right-10 w-4 h-4 rounded-full bg-[#00FF99] shadow-[0_0_15px_#00FF99]"></div>
      <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-[#B266FF] shadow-[0_0_15px_#B266FF]"></div>

      {/* Meeting container */}
      <div ref={meetingContainerRef} className="h-full" />

      {/* Control panel */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#1A1A1A]/90 border border-[#333333] rounded-xl p-4 shadow-2xl flex items-center gap-4">
        <button
          onClick={sendMeetingLink}
          disabled={loading || sent}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
            loading || sent
              ? "bg-[#333333] text-gray-400"
              : "bg-gradient-to-r from-[#00BFFF] to-[#1E90FF] text-white hover:shadow-lg"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Sending...
            </>
          ) : sent ? (
            <>
              <Check size={18} />
              Invite Sent
            </>
          ) : (
            <>
              <Mail size={18} />
              Resend Invite
            </>
          )}
        </button>

        <button
          onClick={copyMeetingLink}
          className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-[#222222] border border-[#333333] text-white hover:bg-[#333333] transition-all"
        >
          <Copy size={18} />
          Copy Link
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg border-l-4 flex items-center gap-3 ${
            notification.type === "error"
              ? "bg-red-900/30 border-red-500"
              : "bg-green-900/30 border-green-500"
          }`}
        >
          {notification.type === "error" ? (
            <AlertCircle className="text-red-400" />
          ) : (
            <Check className="text-green-400" />
          )}
          <span className="text-white">{notification.message}</span>
        </div>
      )}

      {/* Footer Glow */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#00BFFF] via-[#B266FF] to-[#FF7F50]"></div>
    </div>
  );
}
