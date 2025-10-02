import emailjs from "@emailjs/browser";

//onecollege@gmail.com paste there 
const sendRejectionEmail = async (templateParams) => {
  const serviceID = "service_fchqmyj"; 
  const templateID = "template_wt0j9b8"; 
  const publicKey = "-bahTLywkdOEjvtGv"; 

  try {
    return await emailjs.send(serviceID, templateID, templateParams, publicKey);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed. Please try again later.");
  }
};

export default sendRejectionEmail;

