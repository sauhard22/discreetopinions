import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendOtp(phone, code) {
  await client.messages.create({
    body: `Your DiscreetOpinions verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}
