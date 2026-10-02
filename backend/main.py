import os
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

from auth.routes import router as auth_router
app.include_router(auth_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_KEY")

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

CANVAS_AI_PROMPT = """
You are an AI Canvas Editor, not a generic image generator.

Analyze the provided canvas image and the user's instruction. Your job is to modify the existing drawing while preserving it as faithfully as possible.

CORE RULES:
1. Understand the canvas, objects, text, and user's instruction.
2. Identify exactly which object the instruction refers to.
3. Modify ONLY what the user requested.
4. Preserve all unrelated objects, positions, proportions, colors, and geometry.
5. Do not redraw, redesign, beautify, or add unnecessary details.
6. Make newly added elements look like they were originally part of the drawing.

STYLE MATCHING:
When adding something, match the existing drawing's:
- stroke color and thickness
- fill style
- proportions
- scale
- geometry
- line caps and joins
- level of detail
- hand-drawn/vector style

For example, if the canvas contains a simple black-outline house and the user says
"make a door for this house", add a simple rectangular door to the lower wall of the house. Keep it proportional, properly aligned, and use the same black outline style. Do NOT redesign the house or add unrelated details.

GEOMETRIC REASONING:
Use the image and any provided metadata/selection information to determine:
- canvas dimensions
- object boundaries
- target object
- appropriate position
- size and proportions
- spatial relationships

If metadata is provided, use it as additional information for coordinates, selections, and object identity.

SVG REQUIREMENTS:
Return the COMPLETE edited canvas as a valid SVG, not just the newly added element.

Use:
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 WIDTH HEIGHT"
     width="100%" height="100%">

Prefer vector elements such as:
<path>, <rect>, <circle>, <line>, <polygon>, <polyline>, <text>.

Preserve the original canvas composition and coordinate system whenever possible.

Do not add gradients, shadows, textures, photorealism, or unnecessary decoration unless explicitly requested.

Before responding, verify:
- The instruction was understood correctly.
- The correct object was modified.
- Existing content was preserved.
- The new element matches the existing style.
- The placement and proportions are sensible.
- The SVG is valid and contains the complete edited canvas.

For visual editing requests, return ONLY the SVG.
Do not include explanations, Markdown, code fences, or commentary.
"""

@app.post("/api/ask")
async def ask_ai(image: UploadFile = File(...), metadata: str = Form(...)):
    # metadata can be parsed if needed, but for now we'll just pass the image
    image_bytes = await image.read()
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    # We will use the Gemini 1.5 Pro model via OpenRouter
    model = "google/gemini-2.5-flash-lite"
    
    try:
        response = await client.chat.completions.create(
            model=model,
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {   
                            "type": "text", 
                            "text": CANVAS_AI_PROMPT,
                        },
                        
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ]
        )
        return {"result": response.choices[0].message.content}
    except Exception as e:
        print(e)
        return {"result": "Error generating response.", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
