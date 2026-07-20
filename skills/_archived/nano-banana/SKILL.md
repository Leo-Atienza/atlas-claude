---
name: nano-banana
description: Google Nano Banana (Gemini Image) — AI image generation and editing via the Gemini API. Covers all models (2.5 Flash, 3.1 Flash, 3 Pro), text-to-image, image editing, multi-turn chat, grounding, reference images, thinking mode, batch processing, constraints, and prompting best practices. Activate when code imports google.genai or @google/genai and the task involves image generation or editing.
---

# Google Nano Banana — Gemini Image Generation & Editing

## 1. Models

| Model | ID | Best For | Thinking | Search Grounding | Image Search | Caching | 4K | Max Refs (Obj/Char) |
|---|---|---|---|---|---|---|---|---|
| **Nano Banana** | `gemini-2.5-flash-image` | High-volume, low-latency, conversational editing | No | No | No | Yes | No | — |
| **Nano Banana 2** | `gemini-3.1-flash-image-preview` | Speed + quality balance, text rendering, web-grounded images | Yes (Minimal/High) | Web + Image | Yes | No | Yes | 10 / 4 |
| **Nano Banana Pro** | `gemini-3-pro-image-preview` | Professional assets, studio-quality, complex compositions | Yes | Web only | No | No | Yes | 6 / 5 |

**Token limits** (all models): 65,536 input / 32,768 output.

**Model selection guide:**
- Cost-sensitive, high-volume → `gemini-2.5-flash-image`
- Best quality/speed ratio, text in images → `gemini-3.1-flash-image-preview`
- Studio-grade, complex graphic design, accurate data viz → `gemini-3-pro-image-preview`

## 2. Quick Start

### Python

```bash
pip install google-genai
```

```python
from google import genai
from google.genai import types

client = genai.Client()  # Uses GOOGLE_API_KEY env var

response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents="A cozy cabin in a snowy forest at twilight, warm light glowing from windows",
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
    ),
)

for part in response.parts:
    if part.text is not None:
        print(part.text)
    elif part.inline_data is not None:
        image = part.as_image()
        image.save("output.png")
```

### JavaScript / TypeScript

```bash
npm install @google/genai
```

```javascript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({});  // Uses GOOGLE_API_KEY env var

const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: "A cozy cabin in a snowy forest at twilight, warm light glowing from windows",
    config: { responseModalities: ["TEXT", "IMAGE"] },
});

for (const part of response.candidates[0].content.parts) {
    if (part.text) {
        console.log(part.text);
    } else if (part.inlineData) {
        const buffer = Buffer.from(part.inlineData.data, "base64");
        fs.writeFileSync("output.png", buffer);
    }
}
```

## 3. Text-to-Image (Full Config)

```python
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents="A dramatic product shot of a gold wristwatch on dark marble, studio lighting",
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="16:9",   # See aspect ratio table below
            image_size="2K",       # "512", "1K", "2K", "4K" — MUST use uppercase K
        ),
    ),
)
```

### Supported Aspect Ratios
`1:1` `1:4` `1:8` `2:3` `3:2` `3:4` `4:1` `4:3` `4:5` `5:4` `8:1` `9:16` `16:9` `21:9`

Note: `1:4`, `4:1`, `1:8`, `8:1` are Nano Banana 2 (3.1 Flash) only.

### Supported Resolutions

| Resolution | Token Cost | Models |
|---|---|---|
| 512 (0.5K) | 747 tokens | 3.1 Flash only |
| 1K (default) | 1120 tokens | All |
| 2K | 1680 tokens | 3.1 Flash, 3 Pro |
| 4K | 2520 tokens (Flash) / 2000 tokens (Pro) | 3.1 Flash, 3 Pro |

## 4. Image Editing

Pass image(s) alongside text instructions. The model can add, remove, modify elements, change style, adjust color grading, blur backgrounds, alter poses, colorize B&W photos, and more.

### Python — Edit an Existing Image

```python
from PIL import Image

response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[
        "Remove the person in the background and replace with a blurred bokeh effect",
        Image.open("photo.png"),
    ],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
    ),
)

for part in response.parts:
    if part.inline_data is not None:
        part.as_image().save("edited.png")
```

### JavaScript — Edit an Existing Image

```javascript
import * as fs from "node:fs";

const imageData = fs.readFileSync("photo.png").toString("base64");

const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [
        { text: "Remove the person in the background and replace with a blurred bokeh effect" },
        { inlineData: { mimeType: "image/png", data: imageData } },
    ],
    config: { responseModalities: ["TEXT", "IMAGE"] },
});
```

### Common Editing Operations
- **Object removal**: "Remove the parked car from the left side"
- **Background replacement**: "Replace the background with a sunset beach scene"
- **Style transfer**: "Convert this photo to watercolor painting style"
- **Background blur**: "Blur the background with bokeh effect, keep subject sharp"
- **Colorization**: "Add natural color to this black and white photo"
- **Pose alteration**: "Change the subject's pose to sitting"
- **Color grading**: "Apply warm golden-hour color grading"
- **Text overlay**: "Add the text 'SALE 50%' in bold red at the top"
- **Outpainting**: "Extend the image to the left to show more of the room"

## 5. Multi-Turn Conversational Editing

Use chat mode for iterative refinement. The model maintains conversation history across turns.

### Python

```python
chat = client.chats.create(
    model="gemini-3.1-flash-image-preview",
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
    ),
)

# Turn 1: Generate
response = chat.send_message("Create a vibrant infographic explaining photosynthesis")
# Save initial image...

# Turn 2: Refine
response = chat.send_message("Make the colors more muted and add a watercolor texture")
# Save refined image...

# Turn 3: Adjust
response = chat.send_message("Add a title at the top: 'How Plants Make Food'")
# Save final image...
```

### JavaScript

```javascript
const chat = ai.chats.create({
    model: "gemini-3.1-flash-image-preview",
    config: { responseModalities: ["TEXT", "IMAGE"] },
});

const response1 = await chat.sendMessage("Create a vibrant infographic explaining photosynthesis");
// Extract image...

const response2 = await chat.sendMessage("Make the colors more muted and add a watercolor texture");
// Extract refined image...
```

## 6. Reference Images & Character Consistency

Use multiple input images as style/subject references. Label them clearly in the prompt.

### Limits Per Model

| Model | Object References | Character References | Total |
|---|---|---|---|
| 3.1 Flash | Up to 10 | Up to 4 | 14 |
| 3 Pro | Up to 6 | Up to 5 | 11 |

### Python — Character Consistency

```python
from PIL import Image

ref1 = Image.open("character_front.png")
ref2 = Image.open("character_side.png")
ref3 = Image.open("character_closeup.png")

response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[
        "Using the character shown in the reference images, create a new scene "
        "where they are standing in a rainy city street at night, holding an umbrella. "
        "Maintain the exact same character appearance, clothing, and features.",
        ref1, ref2, ref3,
    ],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="16:9", image_size="2K"),
    ),
)
```

### Object/Style References

```python
style_ref = Image.open("art_style_reference.png")
object_ref = Image.open("product_photo.png")

response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=[
        "Create a product advertisement for this item (second image) "
        "using the artistic style shown in the first image. "
        "Place the product on a marble pedestal with dramatic lighting.",
        style_ref, object_ref,
    ],
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
    ),
)
```

## 7. Grounding

### Google Web Search — Real-Time Data in Images

```python
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents="Create an infographic showing today's weather forecast for Tokyo",
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        tools=[{"google_search": {}}],
    ),
)

# Access grounding metadata
metadata = response.candidates[0].grounding_metadata
if metadata:
    for chunk in metadata.grounding_chunks:
        print(f"Source: {chunk.web.uri}")
    if metadata.search_entry_point:
        print(f"Search HTML: {metadata.search_entry_point.rendered_content}")
```

### Image Search (3.1 Flash Only)

Brings visual context from Google Images into generation. Cannot search for images of people.

```python
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents="Create a collage-style mood board inspired by mid-century modern furniture design",
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        tools=[
            types.Tool(google_search=types.GoogleSearch(
                search_types=types.SearchTypes(
                    web_search=types.WebSearch(),
                    image_search=types.ImageSearch(),
                )
            ))
        ],
    ),
)

# Access image search metadata
metadata = response.candidates[0].grounding_metadata
if metadata:
    for query in metadata.image_search_queries:
        print(f"Image search query: {query}")
    for chunk in metadata.grounding_chunks:
        print(f"Source page: {chunk.web.uri}")
        if hasattr(chunk, 'image_uri'):
            print(f"Source image: {chunk.image_uri}")
```

### Attribution Requirements (Mandatory for Image Search)
When displaying Image Search results to end users, you MUST:
1. Provide a recognizable, clickable link to the source webpage
2. Enable direct single-click navigation from the displayed image to the source page
3. Never use intermediate viewers or multi-click paths

## 8. Thinking Mode

Nano Banana 2 and Pro generate up to **2 interim images** to test composition and logic before the final output. Thinking is enabled by default and **cannot be disabled**.

### Control Thinking Depth (3.1 Flash)

```python
response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents="Design a complex mechanical watch face with visible gears",
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        thinking_config=types.ThinkingConfig(
            thinking_level="High",        # "Minimal" (default) or "High"
            include_thoughts=True,         # Return interim reasoning images
        ),
    ),
)

# Thinking tokens are billed regardless of include_thoughts setting
for part in response.parts:
    if part.thought:
        print("Thinking:", part.text or "[interim image]")
    elif part.inline_data:
        part.as_image().save("final.png")
```

### Thought Signatures

Non-thought response parts include encrypted `thought_signature` fields that preserve reasoning context across multi-turn conversations. Official SDKs handle this automatically in chat mode. For REST/raw WebSocket, you must manually pass signatures back.

## 9. Batch Processing

For high-volume generation with relaxed latency (up to 24 hours), use the Batch API for a **50% cost discount**.

```python
# Submit batch job
batch_job = client.batches.create(
    model="gemini-3.1-flash-image-preview",
    src="gs://my-bucket/requests.jsonl",
    config=types.CreateBatchJobConfig(
        dest="gs://my-bucket/results/",
        display_name="product-images-batch",
    ),
)

# Check status
status = client.batches.get(name=batch_job.name)
print(f"State: {status.state}")
```

## 10. Configuration Reference

### GenerateContentConfig (Complete)

```python
config = types.GenerateContentConfig(
    # REQUIRED for image output
    response_modalities=["TEXT", "IMAGE"],

    # Image-specific config
    image_config=types.ImageConfig(
        aspect_ratio="16:9",          # See aspect ratio table
        image_size="2K",              # "512", "1K", "2K", "4K" — uppercase K required
    ),

    # Thinking (3.1 Flash and 3 Pro only)
    thinking_config=types.ThinkingConfig(
        thinking_level="High",        # "Minimal" (default) or "High"
        include_thoughts=True,        # Show interim reasoning
    ),

    # Grounding tools
    tools=[
        {"google_search": {}},        # Simple web search
        # OR for web + image search:
        # types.Tool(google_search=types.GoogleSearch(
        #     search_types=types.SearchTypes(
        #         web_search=types.WebSearch(),
        #         image_search=types.ImageSearch(),
        #     )
        # ))
    ],

    # Safety settings (optional)
    safety_settings=[
        types.SafetySetting(
            category="HARM_CATEGORY_HARASSMENT",
            threshold="BLOCK_ONLY_HIGH",
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_HATE_SPEECH",
            threshold="BLOCK_ONLY_HIGH",
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold="BLOCK_ONLY_HIGH",
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold="BLOCK_ONLY_HIGH",
        ),
    ],
)
```

### Safety Threshold Values
- `BLOCK_NONE` — No blocking
- `BLOCK_ONLY_HIGH` — Block only high-probability harmful content
- `BLOCK_MEDIUM_AND_ABOVE` — Block medium+ probability
- `BLOCK_LOW_AND_ABOVE` — Block low+ probability (most restrictive)

### JavaScript Config Equivalent

```javascript
const config = {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: {
        aspectRatio: "16:9",
        imageSize: "2K",
    },
    thinkingConfig: {
        thinkingLevel: "HIGH",
        includeThoughts: true,
    },
    tools: [{ googleSearch: {} }],
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
};
```

## 11. Platform SDKs

### REST / curl

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent" \
  -H "x-goog-api-key: $GOOGLE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{"parts": [{"text": "A serene mountain lake at sunrise"}]}],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {"aspectRatio": "16:9", "imageSize": "2K"}
    }
  }'
```

Response contains `parts[].inlineData.data` (base64) and `parts[].inlineData.mimeType` ("image/png" or "image/jpeg").

### Go

```go
import "google.golang.org/genai"

client, _ := genai.NewClient(ctx, nil)
model := client.GenerativeModel("gemini-3.1-flash-image-preview")
model.GenerationConfig.ResponseModalities = []string{"TEXT", "IMAGE"}

resp, _ := model.GenerateContent(ctx, genai.Text("A serene mountain lake"))
```

### Firebase (Swift)

```swift
let model = FirebaseAI.firebaseAI(backend: .googleAI())
    .generativeModel(
        modelName: "gemini-3.1-flash-image-preview",
        generationConfig: GenerationConfig(responseModalities: [.text, .image])
    )

let response = try await model.generateContent("A serene mountain lake at sunrise")
for part in response.inlineDataParts {
    let image = UIImage(data: part.data)
}
```

### Firebase (Kotlin)

```kotlin
val model = Firebase.ai(backend = GenerativeBackend.googleAI())
    .generativeModel(
        modelName = "gemini-3.1-flash-image-preview",
        generationConfig = generationConfig {
            responseModalities = listOf(ResponseModality.TEXT, ResponseModality.IMAGE)
        }
    )

val response = model.generateContent("A serene mountain lake at sunrise")
response.candidates.first().content.parts.filterIsInstance<ImagePart>().forEach { part ->
    val bitmap = part.image
}
```

### Firebase (Flutter / Dart)

```dart
final model = FirebaseAI.googleAI().generativeModel(
    model: 'gemini-3.1-flash-image-preview',
    generationConfig: GenerationConfig(
        responseModalities: [ResponseModalities.text, ResponseModalities.image],
    ),
);

final response = await model.generateContent([Content.text('A serene mountain lake')]);
for (final part in response.inlineDataParts) {
    // part.bytes contains PNG data
}
```

### Firebase (Web / JS)

```javascript
import { getAI, GoogleAIBackend } from "firebase/ai";

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = ai.getGenerativeModel({
    model: "gemini-3.1-flash-image-preview",
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
});

const result = await model.generateContent("A serene mountain lake at sunrise");
const parts = result.response.inlineDataParts();
```

**Firebase note**: `aspect_ratio` and `image_size` are NOT supported as config params in Firebase SDKs. Specify dimensions in the prompt instead (e.g., "Generate a 16:9 landscape image").

**Vertex AI note**: When using 3 Pro or 3.1 Flash via Vertex AI, set location to `global`.

## 12. Pricing

### Per Output Image (Google AI Studio / Gemini API)

| Model | 512 | 1K | 2K | 4K |
|---|---|---|---|---|
| **2.5 Flash** | — | ~$0.039 | — | — |
| **3.1 Flash** | $0.045 | $0.067 | $0.101 | $0.151 |
| **3 Pro** | — | $0.134 | $0.134 | $0.240 |

### Input Image Cost
- 3 Pro: 560 tokens per input image
- 3.1 Flash / 2.5 Flash: standard token counting

### Batch API Discount
**50% off** all token prices. 24-hour turnaround window.
- 2.5 Flash batch: ~$0.0195/image
- 3.1 Flash 1K batch: ~$0.034/image

### Cost Optimization Tips
- Use `512` resolution for thumbnails/previews (3.1 Flash only)
- Use `1K` for web display (good enough for most use cases)
- Reserve `4K` for print/professional assets
- Batch non-urgent work for 50% savings
- Use 2.5 Flash for high-volume, cost-sensitive workloads

## 13. Prompting Best Practices

### Core Principle
**Describe scenes narratively, don't list keywords.** The model excels at understanding natural language descriptions.

### Photorealistic Template

```
"A [shot type] of [subject] [action/pose] in [environment/setting].
[Lighting description]. Shot on [camera/lens]. [Mood/atmosphere].
Aspect ratio [ratio]."
```

Example:
```
"A close-up portrait of a woman with silver hair standing in a field of lavender
at golden hour. Soft backlight creating a warm halo effect. Shot on 85mm f/1.4.
Dreamy, ethereal mood. Aspect ratio 3:4."
```

### Stylized / Illustration Template

```
"A [style] illustration of [subject] with [specific features].
[Color palette]. [Line style]. [Shading technique].
[Background treatment]."
```

Example:
```
"A kawaii-style illustration of a cat wearing a tiny chef's hat, baking cookies.
Pastel pink and mint color palette. Soft rounded lines with cel-shading.
Simple gradient background with floating sparkles."
```

### Commercial / Product Template

```
"Professional product shot of [item] on [surface/backdrop].
[Lighting setup]. [Camera angle]. Clean, commercial aesthetic.
[Additional details: reflections, shadows, props]."
```

### Tips for Better Results
- Include camera/lens details for photorealistic output
- Specify style explicitly: "watercolor", "oil painting", "3D render", "pixel art"
- Mention color palettes and textures
- Request transparent backgrounds where applicable ("on a transparent background, PNG")
- For text in images: spell out exact text, specify font style and placement
- Use grounding with Google Search for images requiring real-world accuracy

## 14. User-Defined Constraints

When users specify constraints, enforce them through config and/or prompt engineering.

### Aspect Ratio Constraint

```python
# User wants Instagram Stories format
config = types.GenerateContentConfig(
    response_modalities=["TEXT", "IMAGE"],
    image_config=types.ImageConfig(aspect_ratio="9:16"),
)
```

### Resolution Constraint

```python
# User wants print-quality output
config = types.GenerateContentConfig(
    response_modalities=["TEXT", "IMAGE"],
    image_config=types.ImageConfig(image_size="4K"),
)
```

### Style Constraint (via Prompt Engineering)

```python
# User wants consistent brand style
system_style = (
    "All images must use the following style: flat design illustration, "
    "limited to 4 colors (navy #1a237e, coral #ff6f61, white #ffffff, "
    "light gray #f5f5f5). Clean geometric shapes, no gradients, "
    "no photorealistic elements."
)

response = client.models.generate_content(
    model="gemini-3.1-flash-image-preview",
    contents=f"{system_style}\n\nCreate an icon for a settings menu.",
    config=types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
    ),
)
```

### Safety Constraint (Strict Filtering)

```python
# User requires family-friendly content only
config = types.GenerateContentConfig(
    response_modalities=["TEXT", "IMAGE"],
    safety_settings=[
        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_LOW_AND_ABOVE"),
        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_LOW_AND_ABOVE"),
        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_LOW_AND_ABOVE"),
        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_LOW_AND_ABOVE"),
    ],
)
```

### Language Constraint

Supported languages for optimal performance:
- `en` — English
- `es-mx` — Spanish (Mexico)
- `ja-jp` — Japanese
- `zh-cn` — Chinese (Simplified)
- `hi-in` — Hindi

For other languages, results may be inconsistent. Prompt in a supported language for best results, then translate text overlays separately.

### Content Policy Constraint

Images that could be deceptive, harassing, or harmful are prohibited. The model will refuse:
- Deepfakes / impersonation of real people
- Violent or graphic content
- Content violating Google's Prohibited Use Policy

## 15. Limitations & Gotchas

1. **SynthID watermark** — All generated images include an invisible SynthID watermark. Cannot be removed.
2. **Thinking is mandatory** — Cannot disable thinking on 3.1 Flash or 3 Pro. Tokens are billed even with `include_thoughts=False`.
3. **Uppercase K required** — Resolution must be `"2K"` not `"2k"`. Lowercase is rejected.
4. **Image Search cannot search people** — Image Search grounding excludes person-related queries.
5. **Firebase SDK limitations** — `aspect_ratio` and `image_size` params not supported; specify in prompt text instead.
6. **Vertex AI location** — Must set `location="global"` for 3 Pro and 3.1 Flash on Vertex AI.
7. **Output format** — Images are base64-encoded inline data (`image/png` or `image/jpeg`). No URL-based output.
8. **Cannot generate images only** — Response modalities MUST include `"TEXT"`. The model always returns text alongside images.
9. **Deprecated model** — `gemini-2.5-flash-image-preview` is deprecated. Use `gemini-2.5-flash-image` (stable).
10. **Reference image limits** — Exceeding the per-model limit (14 for Flash, 11 for Pro) causes errors.
11. **Supported languages** — Best results in en, es-mx, ja-jp, zh-cn, hi-in. Other languages may produce inconsistent output.

## 16. Error Handling

### Common Failures and Fixes

**Model returns text-only (no image)**
- Ensure `response_modalities` includes `"IMAGE"` — this is the most common mistake
- Add explicit image request in prompt: "Generate an image of..." or "Create a picture showing..."

**Resolution rejected**
- Use uppercase K: `"2K"` not `"2k"`
- Check model supports the resolution (512 is 3.1 Flash only)

**Safety filter blocked**
- Check `response.prompt_feedback` for block reason
- Rephrase prompt to avoid triggering safety filters
- Adjust `safety_settings` thresholds if appropriate for your use case

**Image search returns no results**
- Image Search cannot query for people
- Only available on `gemini-3.1-flash-image-preview`

**Batch job stuck**
- Batch API has up to 24-hour turnaround — this is expected
- Check `client.batches.get(name=job.name).state`

### Python Error Handling Pattern

```python
from google.genai import errors

try:
    response = client.models.generate_content(
        model="gemini-3.1-flash-image-preview",
        contents="Generate an image of a sunset over mountains",
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
        ),
    )

    images_found = False
    for part in response.parts:
        if part.inline_data is not None:
            part.as_image().save("output.png")
            images_found = True

    if not images_found:
        print("Warning: Model returned text-only response")
        print(response.text)

        # Check for safety blocks
        if response.prompt_feedback:
            print(f"Prompt feedback: {response.prompt_feedback}")

except errors.ClientError as e:
    print(f"Client error: {e}")
except errors.ServerError as e:
    print(f"Server error (retry): {e}")
```
