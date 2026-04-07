<!--
id: SK-091
name: edge-intelligence
description: Edge Intelligence — on-device AI/ML for mobile and desktop. llama.rn (15-30 tok/s), MediaPipe (pose/face/hands/objects), sqlite-vec (vector search), on-device RAG pipeline, TextDecoderStream for AI streaming. Privacy-first architecture.
keywords: edge-ai, on-device-ai, llama-rn, mediapipe, sqlite-vec, rag, vector-search, ml, machine-learning, local-ai, privacy, streaming, llama-cpp
version: 1.0.0
-->

# Edge Intelligence

## When to Use This Skill

**Auto-activate when:** running AI/ML models on-device, building local RAG pipelines, integrating computer vision, or implementing privacy-first AI features. SK-058 (Universal Conductor) routes here.

---

## Edge AI Decision Matrix

| Capability | Mobile (Expo/RN) | Desktop (Tauri) | When to Use |
|-----------|-----------------|-----------------|-------------|
| Text generation (LLM) | llama.rn | llama.cpp via Rust | Chatbots, summarization, text completion |
| Embeddings | llama.rn (embedding mode) | llama.cpp embeddings | RAG, semantic search, similarity |
| Vector search | sqlite-vec (Expo SDK 54) | sqlite-vec via tauri-plugin-sql | Retrieval, nearest-neighbor |
| Object detection | MediaPipe + Vision Camera | MediaPipe WASM | Inventory, safety, counting |
| Pose estimation | MediaPipe Pose | MediaPipe WASM | Fitness, physical therapy, gesture |
| Face detection | MediaPipe Face | MediaPipe WASM | Authentication, expressions, AR |
| Hand tracking | MediaPipe Hands | MediaPipe WASM | Sign language, gesture control |
| OCR | ML Kit (via expo plugin) | Tesseract.js | Document scanning, receipt processing |
| Speech-to-text | expo-speech-recognition | Whisper.cpp via Rust | Voice commands, transcription |

**Cloud vs Edge decision:**
- **Use Edge when:** privacy-critical data, offline required, latency-sensitive (<100ms), predictable costs, simple inference tasks
- **Use Cloud when:** large models needed (>7B params on mobile), training/fine-tuning, complex multi-step reasoning, cost of device compute > API cost

---

## The On-Device RAG Pipeline

The headline feature — complete local retrieval-augmented generation:

```
Document → Chunk → Embed → Store → Query → Retrieve → Generate → Stream
   │          │        │       │       │         │          │         │
   ▼          ▼        ▼       ▼       ▼         ▼          ▼         ▼
 expo-fs   custom   llama.rn  sqlite  llama.rn  sqlite   llama.rn  TextDecoder
           splitter  embed()   -vec    embed()   -vec     generate() Stream
```

### Full Implementation

```typescript
// lib/rag-pipeline.ts
import { initLlama, LlamaContext } from 'llama.rn';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

// 1. Initialize models
let context: LlamaContext;

export async function initRAG() {
  const modelPath = `${FileSystem.documentDirectory}models/qwen2.5-1.5b-q4_k_m.gguf`;

  context = await initLlama({
    model: modelPath,
    n_ctx: 2048,
    n_batch: 512,
    n_threads: 4,
    use_mmap: true,
    use_mlock: false,
  });

  // Initialize vector store
  const db = SQLite.openDatabaseSync('vectors.db');
  db.execSync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS chunks USING vec0(
      chunk_id TEXT PRIMARY KEY,
      embedding FLOAT[384]
    )
  `);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS chunk_text (
      chunk_id TEXT PRIMARY KEY,
      source TEXT,
      content TEXT
    )
  `);
}

// 2. Chunk documents
function chunkText(text: string, chunkSize = 512, overlap = 64): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
}

// 3. Embed and store
export async function ingestDocument(source: string, text: string) {
  const db = SQLite.openDatabaseSync('vectors.db');
  const chunks = chunkText(text);

  for (let i = 0; i < chunks.length; i++) {
    const chunkId = `${source}:${i}`;
    const embedding = await context.embedding(chunks[i]);

    db.runSync(
      'INSERT OR REPLACE INTO chunks (chunk_id, embedding) VALUES (?, ?)',
      [chunkId, JSON.stringify(embedding.embedding)]
    );
    db.runSync(
      'INSERT OR REPLACE INTO chunk_text (chunk_id, source, content) VALUES (?, ?, ?)',
      [chunkId, source, chunks[i]]
    );
  }
}

// 4. Retrieve relevant chunks
export async function retrieve(query: string, topK = 3): Promise<string[]> {
  const db = SQLite.openDatabaseSync('vectors.db');
  const queryEmbed = await context.embedding(query);

  const results = db.getAllSync<{ chunk_id: string }>(
    `SELECT chunk_id FROM chunks
     WHERE embedding MATCH ?
     ORDER BY distance
     LIMIT ?`,
    [JSON.stringify(queryEmbed.embedding), topK]
  );

  return results.map((r) => {
    const row = db.getFirstSync<{ content: string }>(
      'SELECT content FROM chunk_text WHERE chunk_id = ?',
      [r.chunk_id]
    );
    return row?.content ?? '';
  });
}

// 5. Generate with context
export async function ragQuery(
  question: string,
  onToken?: (token: string) => void
): Promise<string> {
  const context_chunks = await retrieve(question);
  const contextText = context_chunks.join('\n\n---\n\n');

  const prompt = `Based on the following context, answer the question.

Context:
${contextText}

Question: ${question}

Answer:`;

  const result = await context.completion({
    prompt,
    n_predict: 512,
    temperature: 0.7,
    top_p: 0.9,
    stop: ['</s>', '\n\nQuestion:'],
  }, (token) => {
    onToken?.(token.token);
  });

  return result.text;
}
```

---

## llama.rn Deep Dive

### Installation

```bash
npm install llama.rn
# Requires dev client (not Expo Go)
npx expo prebuild
```

### Model Selection by Device Tier

| Device Tier | RAM | Model Size | Example Models | Tokens/sec |
|------------|-----|------------|----------------|------------|
| Flagship (iPhone 16 Pro, S25 Ultra) | 8GB+ | 3-7B Q4 | Qwen2.5-7B-Q4, Llama-3.2-3B | 15-30 |
| Mid-range (iPhone 15, Pixel 8) | 6GB | 1.5-3B Q4 | Qwen2.5-1.5B-Q4, Phi-3-mini | 20-40 |
| Budget (iPhone SE, entry Android) | 4GB | 0.5-1.5B Q8 | Qwen2.5-0.5B-Q8, TinyLlama | 25-50 |

### Model Download & Management

```typescript
import * as FileSystem from 'expo-file-system';

const MODELS_DIR = `${FileSystem.documentDirectory}models/`;

async function downloadModel(
  url: string,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const path = `${MODELS_DIR}${filename}`;

  // Check if already downloaded
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) return path;

  await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });

  const download = FileSystem.createDownloadResumable(
    url,
    path,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress?.(totalBytesWritten / totalBytesExpectedToWrite);
    }
  );

  const result = await download.downloadAsync();
  return result!.uri;
}

// Device-aware model selection
function selectModel(availableRam: number) {
  if (availableRam >= 8) return { model: 'qwen2.5-7b-q4_k_m.gguf', ctx: 4096 };
  if (availableRam >= 6) return { model: 'qwen2.5-1.5b-q4_k_m.gguf', ctx: 2048 };
  return { model: 'qwen2.5-0.5b-q8_0.gguf', ctx: 1024 };
}
```

### Streaming Responses

```tsx
import { initLlama } from 'llama.rn';

function AIChat() {
  const [messages, setMessages] = useState<string[]>([]);
  const [streaming, setStreaming] = useState('');
  const contextRef = useRef<LlamaContext | null>(null);

  const sendMessage = async (input: string) => {
    if (!contextRef.current) return;

    setStreaming('');
    setMessages((prev) => [...prev, `You: ${input}`]);

    let response = '';
    await contextRef.current.completion(
      {
        prompt: `User: ${input}\nAssistant:`,
        n_predict: 256,
        temperature: 0.7,
        stop: ['User:', '</s>'],
      },
      (token) => {
        response += token.token;
        setStreaming(response);
      }
    );

    setMessages((prev) => [...prev, `AI: ${response}`]);
    setStreaming('');
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList data={messages} renderItem={({ item }) => <Text>{item}</Text>} />
      {streaming && <Text style={{ opacity: 0.7 }}>{streaming}</Text>}
    </View>
  );
}
```

### Memory Management

```typescript
// Release context when not in use
async function releaseModel() {
  if (context) {
    await context.release();
    context = null;
  }
}

// Handle app backgrounding
import { AppState } from 'react-native';

AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    releaseModel(); // Free RAM when backgrounded
  }
});
```

---

## MediaPipe Integration

### With Vision Camera Frame Processor

```bash
npm install @mediapipe/tasks-vision react-native-vision-camera
```

```tsx
import { Camera, useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';

function PoseDetector() {
  const device = useCameraDevice('back');
  const poses = useSharedValue<Pose[]>([]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // Frame processor runs on GPU thread
    // Integrate MediaPipe pose detection here
    // Results update shared value for Reanimated overlay
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device!}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="rgb"
        fps={30}
      />
      <PoseOverlay poses={poses} />
    </View>
  );
}
```

### Object Detection Pattern

```typescript
interface Detection {
  label: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

// Process detections from frame processor
function processDetections(detections: Detection[], minConfidence = 0.7) {
  return detections
    .filter((d) => d.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence);
}
```

---

## sqlite-vec (Vector Search)

Expo SDK 54 ships sqlite-vec natively — no extra install needed.

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('app.db');

// Create vector table
db.execSync(`
  CREATE VIRTUAL TABLE IF NOT EXISTS embeddings USING vec0(
    item_id TEXT PRIMARY KEY,
    embedding FLOAT[384]
  )
`);

// Insert vectors
function insertEmbedding(itemId: string, embedding: number[]) {
  db.runSync(
    'INSERT INTO embeddings (item_id, embedding) VALUES (?, ?)',
    [itemId, JSON.stringify(embedding)]
  );
}

// Similarity search
function findSimilar(queryEmbedding: number[], limit = 5) {
  return db.getAllSync<{ item_id: string; distance: number }>(
    `SELECT item_id, distance
     FROM embeddings
     WHERE embedding MATCH ?
     ORDER BY distance
     LIMIT ?`,
    [JSON.stringify(queryEmbedding), limit]
  );
}

// Hybrid search: vector + metadata filter
function hybridSearch(queryEmbedding: number[], category: string, limit = 5) {
  return db.getAllSync<{ item_id: string; distance: number }>(
    `SELECT e.item_id, e.distance
     FROM embeddings e
     JOIN items i ON e.item_id = i.id
     WHERE e.embedding MATCH ?
       AND i.category = ?
     ORDER BY e.distance
     LIMIT ?`,
    [JSON.stringify(queryEmbedding), category, limit]
  );
}
```

---

## TextDecoderStream for AI Streaming (Expo SDK 54)

```typescript
// Stream AI responses from cloud API with proper backpressure
async function streamCloudAI(prompt: string, onChunk: (text: string) => void) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const reader = response.body!
    .pipeThrough(new TextDecoderStream())
    .getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Parse SSE events
    const lines = value.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta') {
          onChunk(data.delta.text);
        }
      }
    }
  }
}
```

---

## Desktop AI (Tauri + llama.cpp)

For Tauri desktop apps, bind llama.cpp directly in Rust:

```rust
// src-tauri/src/ai.rs
use tauri::ipc::Channel;
use serde::Serialize;

#[derive(Clone, Serialize)]
struct TokenEvent {
    token: String,
    done: bool,
}

#[tauri::command]
async fn generate(
    prompt: String,
    on_token: Channel<TokenEvent>,
) -> Result<String, String> {
    // Use llama-cpp-rs or candle for inference
    // Stream tokens via Channel for real-time UI updates
    let mut full_response = String::new();

    // ... model inference loop ...
    // For each token:
    on_token.send(TokenEvent {
        token: token_text.clone(),
        done: false,
    }).map_err(|e| e.to_string())?;
    full_response.push_str(&token_text);

    on_token.send(TokenEvent {
        token: String::new(),
        done: true,
    }).map_err(|e| e.to_string())?;

    Ok(full_response)
}
```

**Frontend:**
```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

const onToken = new Channel<{ token: string; done: boolean }>();
onToken.onmessage = (event) => {
  if (!event.done) {
    setResponse((prev) => prev + event.token);
  }
};

await invoke('generate', { prompt: userInput, onToken });
```

---

## Privacy Architecture

```
┌─────────────────────────────────────────────┐
│  Privacy Decision Flow                       │
│                                              │
│  User Data → Is it sensitive?                │
│    ├── No → Cloud AI (faster, smarter)       │
│    └── Yes → On-Device AI                    │
│        ├── Can device handle it?             │
│        │   ├── Yes → llama.rn / MediaPipe    │
│        │   └── No → Anonymize → Cloud AI     │
│        └── Store locally only                │
│            └── sqlite-vec + encrypted SQLite  │
└─────────────────────────────────────────────┘
```

**Key rules:**
- Medical, financial, and personal data: always on-device
- User photos for analysis: on-device (never upload without consent)
- General knowledge queries: cloud AI (better quality)
- Embeddings of sensitive docs: on-device sqlite-vec only

---

## Performance Targets

| Metric | Mobile (Flagship) | Mobile (Mid-range) | Desktop |
|--------|-------------------|-------------------|---------|
| LLM tokens/sec | 15-30 | 20-40 (smaller model) | 30-80 |
| Embedding latency | <200ms | <300ms | <100ms |
| Vector search (10k docs) | <50ms | <100ms | <20ms |
| Object detection FPS | 30 | 15-20 | 30+ |
| Model load time | 2-5s | 3-8s | 1-3s |
| RAM for 3B model | ~2.5GB | ~2.5GB | ~2.5GB |

---

## Integration

- **SK-058** — Universal Conductor routes AI tasks here
- **SK-088** — Tauri Desktop Engine for Rust-based llama.cpp integration
- **SK-089** — Device Hardware Bridge for camera → ML pipeline (frame processors)
- **SK-090** — Local-First Architecture for storing embeddings and AI results offline
- **SK-092** — Cross-Platform Monorepo for shared AI interfaces across platforms
