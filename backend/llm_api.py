import anthropic
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_reply(prompt):
    try:
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=256,
            temperature=0.7,
            system="You're a helpful AI voice assistant.",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        print("Claude error:", e)
        return "Sorry, I couldn't process that."
