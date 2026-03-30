const axios = require('axios');
const { getEnvConfig } = require('../config/env');

function buildOtpMessage(code) {
  return `${code} is your GigShield verification code. It expires in 5 minutes.`;
}

async function sendOtpCode(phone, code) {
  const config = getEnvConfig();
  const normalizedPhone = String(phone).trim();
  const message = buildOtpMessage(code);

  if (config.sms.provider === 'twilio') {
    const { accountSid, authToken } = config.sms.twilio;
    if (!accountSid || !authToken || !config.sms.fromNumber) {
      throw new Error('Twilio SMS is selected but the required credentials are missing.');
    }

    const params = new URLSearchParams({
      To: normalizedPhone,
      From: config.sms.fromNumber,
      Body: message,
    });

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      params,
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    return {
      delivery: 'sms',
      provider: 'twilio',
      providerMessageId: response.data?.sid || null,
    };
  }

  if (!config.sms.allowSimulatedSms) {
    throw new Error('Simulated SMS is disabled. Configure a real SMS provider to send OTP codes.');
  }

  return {
    delivery: 'simulated_sms',
    provider: 'console',
    providerMessageId: null,
    otpPreview: code,
  };
}

module.exports = {
  sendOtpCode,
};
