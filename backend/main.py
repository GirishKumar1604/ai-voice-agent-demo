from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

from sarvam_api import transcribe_audio, synthesize_speech
from llm_api import generate_reply

UPLOAD_DIR = "uploads"
REPLY_DIR = "replies"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(REPLY_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "OK"}

@app.post("/stream_chunk")
async def stream_chunk(file: UploadFile = File(...)):
    try:
        chunk_path = os.path.join(UPLOAD_DIR, "chunk.wav")
        with open(chunk_path, "wb") as f:
            f.write(await file.read())

        text = transcribe_audio(chunk_path)
        return {"transcript": text}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/generate_reply")
async def generate_reply_handler(req: Request):
    try:
        data = await req.json()
        text = data["message"]

        ai_reply = generate_reply(text)
        output_path = os.path.join(REPLY_DIR, f"{uuid.uuid4()}_tts.wav")
        success = synthesize_speech(ai_reply, output_path)

        if not success:
            return JSONResponse(status_code=500, content={"error": "TTS failed"})

        return FileResponse(output_path, media_type="audio/wav")
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
