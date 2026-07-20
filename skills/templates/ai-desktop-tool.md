# AI-Powered Desktop Tool Blueprint

## Archetype
Desktop apps with local AI: document analyzer, code assistant, image processor, local knowledge base, privacy-focused AI assistant, research tool.

## Stack
- Tauri 2.0 (Rust backend)
- React + Zustand v5 (frontend)
- llama.cpp via Rust bindings (local LLM inference)
- sqlite-vec (vector storage and search)
- Tauri plugins: fs, dialog, store, updater, shell

## Skills to Load
SK-058 (Universal Conductor), SK-088 (Tauri Desktop), SK-091 (Edge Intelligence), SK-090 (Local-First)

## Architecture
```
┌──────────────────────────────────────────────┐
│  React Frontend (WebView)                     │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ Chat UI  │  │ Doc View │  │ Search UI    │ │
│  └────┬─────┘  └────┬─────┘  └──────┬──────┘ │
│       │              │               │        │
│       │    IPC Commands + Channels   │        │
└───────┼──────────────┼───────────────┼────────┘
        │              │               │
┌───────▼──────────────▼───────────────▼────────┐
│  Rust Core                                     │
│  ┌──────────┐  ┌───────────┐  ┌────────────┐  │
│  │ llama.cpp │  │ Embedder  │  │ sqlite-vec │  │
│  │ inference │  │ (chunking │  │ (vector DB)│  │
│  └──────────┘  │ + embed)  │  └────────────┘  │
│                └───────────┘                   │
└────────────────────────────────────────────────┘
```

- Rust backend handles model loading, inference, file processing
- IPC Commands: `load_model`, `generate`, `embed_document`, `search_vectors`
- IPC Channels: streaming LLM responses to frontend
- Local vector DB for document/knowledge search
- Auto-updater for model and app updates

## File Structure
```
src/                         # React frontend
  components/
    ChatInterface.tsx        # Streaming LLM chat
    DocumentViewer.tsx       # File viewer
    SearchPanel.tsx          # Semantic search
  stores/
    chat-store.ts            # Zustand chat state
    settings-store.ts        # Model settings
  App.tsx
src-tauri/
  src/
    commands/
      inference.rs           # LLM commands
      embeddings.rs          # Embedding commands
      documents.rs           # File processing
    models/
      manager.rs             # Model download + cache
    lib.rs                   # Plugin/command registration
    main.rs
  tauri.conf.json
  capabilities/
    default.json             # fs, dialog, store, updater perms
```

## Setup Checklist
- [ ] Tauri project with React frontend
- [ ] llama.cpp Rust bindings (`llama-cpp-2` crate) configured
- [ ] sqlite-vec for vector storage
- [ ] IPC commands for all AI operations
- [ ] Streaming Channel for LLM output
- [ ] Model download manager with progress reporting
- [ ] Model cache directory with size management
- [ ] Auto-updater with signing keys
- [ ] System tray with quick-access actions
- [ ] Global hotkey for quick input (Cmd/Ctrl+Shift+Space)
