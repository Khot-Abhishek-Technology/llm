import emailjs from "@emailjs/browser";

// khotabhishek15@gmail.com paste there 
const CheateEmail = async (templateParams) => {
  const serviceID = "service_2vkv8la"; 
  const templateID = "template_uzqvqqm"; 
  const publicKey = "huXIX9CP6pI5G13dd"; 

  try {
    return await emailjs.send(serviceID, templateID, templateParams, publicKey);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed. Please try again later.");
  }
};

export default CheateEmail;
