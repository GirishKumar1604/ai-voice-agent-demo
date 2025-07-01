const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

router.post('/', async (req, res) => {
  const { text, language = 'en' } = req.body;

  const langMap = {
    en: 'en-IN',
    hi: 'hi-IN',
    te: 'te-IN'
  };

  const speakerMap = {
    en: 'anushka',
    hi: 'manisha',
    te: 'vidya'
  };

  const target_language_code = langMap[language] || 'en-IN';
  const speaker = speakerMap[language] || 'anushka';

  try {
    const response = await axios.post(
      'https://api.sarvam.ai/text-to-speech',
      {
        text,
        model: 'bulbul:v2',
        speaker,
        target_language_code
      },
      {
        headers: {
          'api-subscription-key': process.env.SARVAM_API_KEY,
          'Content-Type': 'application/json'
        }
        // ⛔️ REMOVE responseType: 'arraybuffer'
      }
    );

    // ✅ decode base64 audio string
    const base64Audio = response.data.audios[0];
    const buffer = Buffer.from(base64Audio, 'base64');

    const filename = `${uuidv4()}.wav`;
    const filepath = path.join(__dirname, '../public', filename);
    fs.writeFileSync(filepath, buffer);

    const stats = fs.statSync(filepath);
    console.log('✅ WAV saved at:', filepath);
    console.log(`📏 WAV size: ${stats.size} bytes`);

    res.json({ audioUrl: `http://localhost:5000/${filename}` });
  } catch (err) {
    const raw = err?.response?.data;
    const errorText = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
    console.error('❌ Sarvam TTS error:', errorText || err.message);
    res.status(500).json({ error: 'TTS generation failed.' });
  }
});

module.exports = router;
