import emailjs from "@emailjs/browser";

//khotabhishek15@gmail.com paste there 
const sendHREmail = async (templateParams) => {
  const serviceID = "service_lnp2kw5"; 
  const templateID = "template_iwa5qdo"; 
  const publicKey = "huXIX9CP6pI5G13dd"; 

  try {
    return await emailjs.send(serviceID, templateID, templateParams, publicKey);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed. Please try again later.");
  }
};

export default sendHREmail;

