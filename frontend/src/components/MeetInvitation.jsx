
import emailjs from "@emailjs/browser";

//abhishekkhot2020@gmail.com paste there 
const sendMeetInvitation = async (templateParams) => {
  const serviceID = "service_e78b8vg"; 
  const templateID = "template_c7kghyx"; 
  const publicKey = "i81BbHRQHhLDpcERg"; 

  try {
    return await emailjs.send(serviceID, templateID, templateParams, publicKey);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed. Please try again later.");
  }
};

export default sendMeetInvitation;
