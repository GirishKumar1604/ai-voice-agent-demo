let audioContext;
let processor;
let input;
let stream;
let recording = false;
let collectedTranscript = '';

const recordBtn = document.getElementById("recordBtn");
const status = document.getElementById("status");

recordBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!recording) {
    await startStreaming();
  } else {
    stopStreaming();
  }
});

async function startStreaming() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext({ sampleRate: 16000 });
  input = audioContext.createMediaStreamSource(stream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);

  input.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (e) => {
    if (!recording) return;
    const inputBuffer = e.inputBuffer.getChannelData(0);
    const pcm = floatTo16BitPCM(inputBuffer);
    sendChunkToBackend(pcm);
  };

  recording = true;
  recordBtn.textContent = "Stop";
  status.textContent = "Recording...";
}

function stopStreaming() {
  recording = false;
  stream.getTracks().forEach(track => track.stop());
  processor.disconnect();
  input.disconnect();
  audioContext.close();
  recordBtn.disabled = true;
  recordBtn.textContent = "Processing...";
  sendTranscriptForReply(collectedTranscript);
}

function floatTo16BitPCM(float32Array) {
  const output = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output.buffer;
}

async function sendChunkToBackend(pcmBuffer) {
  const blob = new Blob([pcmBuffer], { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('file', blob, 'chunk.wav');

  try {
    const res = await fetch('http://127.0.0.1:8000/stream_chunk', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (json.transcript) {
      collectedTranscript += ' ' + json.transcript;
      status.textContent = "Transcribing: " + collectedTranscript;
    }
  } catch (e) {
    console.error("Chunk send error:", e);
  }
}

async function sendTranscriptForReply(text) {
  try {
    const res = await fetch("http://127.0.0.1:8000/generate_reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim() }),
    });
    const blob = await res.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    audio.play();
    audio.onended = () => {
      recordBtn.disabled = false;
      recordBtn.textContent = "Start Recording";
      status.textContent = "Ready.";
      collectedTranscript = '';
    };
    status.textContent = "AI is replying...";
  } catch (e) {
    console.error("Reply error:", e);
    status.textContent = "Error during reply";
  }
}
