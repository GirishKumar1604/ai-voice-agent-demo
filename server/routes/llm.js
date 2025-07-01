const express = require('express');
const router = express.Router();
const axios = require('axios');

// Define the bot's behavior here
const SYSTEM_PROMPT = `
You are a multilingual voice assistant for a school fee collection helpline.
The user may speak in English, Hindi, or Telugu — always reply in the same language they used.
Be polite, helpful, and concise. Do not ask irrelevant questions.
Your main goal is to help the student or parent complete their fee payment.
If the user says "hello", greet them and ask for their name or admission number.
If the user says they want to pay fees, guide them step-by-step.
`;

router.post('/', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        system: SYSTEM_PROMPT,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      },
      {
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({ reply: response.data.content[0].text });
  } catch (err) {
    console.error('Claude API Error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'LLM request failed.' });
  }
});

module.exports = router;
