import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [callStarted, setCallStarted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [detectedLang, setDetectedLang] = useState('en');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  // ⏹️ END CALL: cleanup
  const endCall = () => {
    setCallStarted(false);
    setTranscript('');
    setReply('');
    setAudioUrl('');
    setRecording(false);

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    console.log('📴 Call ended');
  };

  // 🔁 Autoplay + loop recording after TTS finishes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        console.log('🔁 Bot finished speaking, starting mic...');
        if (callStarted) startMicRecording();
      };
    }
  }, [audioUrl, callStarted]);

  // 🟢 Start bot + intro TTS
  const startCall = async () => {
    setCallStarted(true);
    const firstLine = 'Hi! This is the fee payment helpline. How can I help you today?';
    setReply(firstLine);

    try {
      const ttsRes = await axios.post('http://localhost:5000/tts', {
        text: firstLine,
        language: 'en',
      });
      setAudioUrl(ttsRes.data.audioUrl);
    } catch (err) {
      console.error('Intro TTS failed:', err);
    }
  };

  // 🎤 Mic capture → STT → LLM → TTS
  const startMicRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Your browser does not support microphone access.');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      try {
        const sttRes = await axios.post('http://localhost:5000/stt', formData);
        setTranscript(sttRes.data.transcript);
        setDetectedLang(sttRes.data.language || 'en');

        const llmRes = await axios.post('http://localhost:5000/llm', {
          message: sttRes.data.transcript,
        });
        setReply(llmRes.data.reply);

        const ttsRes = await axios.post('http://localhost:5000/tts', {
          text: llmRes.data.reply,
          language: sttRes.data.language || 'en',
        });
        setAudioUrl(ttsRes.data.audioUrl);
      } catch (err) {
        console.error('❌ Processing failed:', err);
        alert('Something went wrong. See console for details.');
      }
    };

    mediaRecorder.start();
    setRecording(true);

    // ⏱️ Stop after 5 seconds (adjust as needed)
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        setRecording(false);
      }
    }, 5000);
  };

  // 🔊 Try autoplay when audioUrl changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      console.log('🔊 Playing audio:', audioUrl);
      audioRef.current.play().catch((err) => {
        console.warn('⚠️ Autoplay failed:', err.message);
      });
    }
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">📞 AI Voice Call Demo</h1>

      {!callStarted ? (
        <button
          onClick={startCall}
          className="px-6 py-3 rounded-lg font-semibold bg-green-600 hover:bg-green-700 transition"
        >
          ☎️ Start Call
        </button>
      ) : (
        <button
          onClick={endCall}
          className="px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 transition"
        >
          🔴 End Call
        </button>
      )}

      {recording && <p className="text-green-400 font-medium">🎙️ Listening...</p>}

      <div className="w-full max-w-xl mt-4 space-y-4 text-left">
        <div>
          <p className="text-gray-400 font-medium">🗣️ You Said:</p>
          <p className="bg-gray-800 p-3 rounded">{transcript || '---'}</p>
        </div>

        <div>
          <p className="text-gray-400 font-medium">🤖 Agent Reply:</p>
          <p className="bg-gray-800 p-3 rounded">{reply || '---'}</p>
        </div>

        {audioUrl && (
          <div className="mt-4">
            <p className="text-gray-400 font-medium">🔊 Response Audio:</p>
            <audio
              ref={audioRef}
              src={audioUrl}
              className="w-full mt-2"
              autoPlay
              controls
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
