const axios = require('axios');

/**
 * WhatsApp integration fallback mapping logic.
 */
async function sendWhatsapp(phone, messageType, templateVars = {}) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  let messageBody = "";
  
  switch(messageType) {
    case "claim_received":
      messageBody = `GigShield: Your claim ${templateVars.claimRef} has been received. We will notify you within 10 minutes.`;
      break;
    case "claim_approved":
      messageBody = `GigShield: ${templateVars.claimRef} approved. ₹${templateVars.amount} sent to ${templateVars.upiHandle}. Stay safe.`;
      break;
    case "soft_hold":
      messageBody = `GigShield: ${templateVars.claimRef} is being verified. Expected update in ${templateVars.hours} hours. No action needed.`;
      break;
    case "manual_review":
      messageBody = `GigShield: ${templateVars.claimRef} needs manual review. We will contact you within 24 hours.`;
      break;
    case "payment_confirmed":
      messageBody = `GigShield: Payment of ₹${templateVars.amount} confirmed in your UPI account.`;
      break;
    default:
      messageBody = "GigShield: System parameters updated natively.";
  }

  // Hackathon fallback routing boundary implicitly replacing live payloads with server metrics visually 
  if (!token || token.trim() === '') {
    console.log(`[MOCK WHATSAPP] TO: ${phone} | MSG: ${messageBody}`);
    return true;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    await axios.post(url, {
       messaging_product: "whatsapp",
       to: phone,
       type: "text",
       text: { body: messageBody }
    }, {
       headers: { "Authorization": `Bearer ${token}` }
    });
    return true;
  } catch(e) {
    console.error("WhatsApp Integration Error native payload fault: ", e.response?.data || e.message);
    return false;
  }
}

module.exports = {
  sendWhatsapp
};
