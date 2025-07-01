const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('audio'), async (req, res) => {
  const audioFilePath = req.file.path;
  const audioFile = fs.createReadStream(audioFilePath);

  try {
    const response = await axios.post(
      'https://api.sarvam.ai/v1/audio/transcribe?language=auto',
      audioFile,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
          'Content-Type': 'audio/wav',
        },
      }
    );

    fs.unlinkSync(audioFilePath);

    res.json({
      transcript: response.data.text,
      language: response.data.language || 'en', // fallback if not returned
    });
  } catch (err) {
    fs.unlinkSync(audioFilePath);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
