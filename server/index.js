// server/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serve TTS audio files

// Routes
app.use('/stt', require('./routes/stt'));
app.use('/llm', require('./routes/llm'));
app.use('/tts', require('./routes/tts'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
