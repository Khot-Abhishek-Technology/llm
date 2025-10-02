import emailjs from "@emailjs/browser";

// college one updated the email js to smart recurit ai
const sendEmail = async (templateParams) => {
  const serviceID = "service_fchqmyj"; 
  const templateID = "template_mhyg6ho"; 
  const publicKey = "-bahTLywkdOEjvtGv"; 

  try {
    return await emailjs.send(serviceID, templateID, templateParams, publicKey);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Email sending failed. Please try again later.");
  }
};


export default sendEmail;
