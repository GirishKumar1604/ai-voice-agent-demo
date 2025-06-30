import os
from sarvamai import SarvamAI
from sarvamai.play import save

SARVAM_API_KEY = "sk_5p4icv8i_FDr3modcqEfiXjI6dcUGYeoZ"
client = SarvamAI(api_subscription_key=SARVAM_API_KEY)

def transcribe_audio(filepath):
    try:
        with open(filepath, "rb") as f:
            response = client.speech_to_text.transcribe(
                file=f,
                model="saarika:v2.5",
                language_code="en-IN"
            )
        return response.get("transcript", "")
    except Exception as e:
        print("STT error:", e)
        return ""

def synthesize_speech(text, output_path):
    try:
        response = client.text_to_speech.convert(
            text=text,
            target_language_code="en-IN",
            speaker="anushka",
            enable_preprocessing=True,
            pitch=0.0,
            pace=1.0,
            loudness=1.0,
            speech_sample_rate=22050
        )
        save(response, output_path)
        return True
    except Exception as e:
        print("TTS error:", e)
        return False
