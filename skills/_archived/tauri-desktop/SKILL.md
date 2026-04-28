<!--
id: SK-088
name: tauri-desktop
description: Tauri 2.0 Desktop Engine — Rust-backed desktop + mobile apps with system WebView. 96% smaller than Electron, 30-40MB RAM, <500ms startup. Covers IPC (Commands + Events + Channels), three-tier security, 30+ plugins, mobile support.
keywords: tauri, desktop, rust, webview, electron-alternative, ipc, commands, events, channels, plugins, security, native-desktop, cross-platform, system-tray, auto-updater
version: 1.0.0
-->

# Tauri 2.0 Desktop Engine

## When to Use This Skill

**Auto-activate when:** building a desktop app, Tauri project detected (`tauri.conf.json`), replacing Electron, building a system-tray app, or any native desktop UI. SK-058 (Universal Conductor) routes here.

**This skill covers:** Tauri architecture, IPC patterns, security model, plugins, desktop UX, and mobile support.

---

## Why Tauri Over Electron

| Metric | Tauri | Electron |
|--------|-------|----------|
| Bundle size | 2-10 MB | 80-200 MB |
| Memory at idle | 30-40 MB | 200-300 MB |
| Startup time | <500ms | 1-3s |
| Backend | Rust (compiled, memory-safe) | Node.js |
| WebView | System (WKWebView/WebView2) | Bundled Chromium |
| Security | Three-tier capability model | Full Node access by default |
| Mobile | iOS + Android via plugins | No |
| Size reduction | 96% smaller | Baseline |

---

## Architecture

```
┌─────────────────────────────┐
│   Frontend (WebView)         │  React/Svelte/Vue/vanilla
│   System WebView2 (Win)      │  No direct OS access
│   WKWebView (macOS)          │  All system calls go through IPC
│   WebKitGTK (Linux)          │
└──────────┬──────────────────┘
           │ IPC: Commands + Events + Channels
┌──────────▼──────────────────┐
│   Rust Core                  │  Business logic, file I/O, crypto
│   (compiled, type-safe)      │  Plugins, managed state
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│   System APIs                │  Notifications, tray, clipboard
│   (via official plugins)     │  Updater, shell, shortcuts
└─────────────────────────────┘
```

---

## IPC Deep Dive

### Commands (Request/Response)

The primary IPC primitive. Rust defines commands, frontend invokes them.

**Rust side:**
```rust
use tauri::State;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};

#[derive(Default)]
struct AppState {
    count: u32,
    items: Vec<String>,
}

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("Item not found: {0}")]
    NotFound(String),
    #[error("Database error: {0}")]
    Database(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        serializer.serialize_str(self.to_string().as_str())
    }
}

#[tauri::command]
fn increment(state: State<'_, Mutex<AppState>>) -> u32 {
    let mut s = state.lock().unwrap();
    s.count += 1;
    s.count
}

#[tauri::command]
fn add_item(name: String, state: State<'_, Mutex<AppState>>) -> Result<usize, AppError> {
    let mut s = state.lock().unwrap();
    s.items.push(name);
    Ok(s.items.len())
}

#[tauri::command]
fn get_item(index: usize, state: State<'_, Mutex<AppState>>) -> Result<String, AppError> {
    let s = state.lock().unwrap();
    s.items.get(index)
        .cloned()
        .ok_or_else(|| AppError::NotFound(format!("index {index}")))
}
```

**Registration in lib.rs:**
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(AppState::default()))
        .invoke_handler(tauri::generate_handler![
            increment,
            add_item,
            get_item,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Frontend (TypeScript):**
```typescript
import { invoke } from '@tauri-apps/api/core';

const count = await invoke<number>('increment');
const total = await invoke<number>('add_item', { name: 'Task 1' });

try {
  const item = await invoke<string>('get_item', { index: 0 });
} catch (error) {
  console.error('Command failed:', error); // "Item not found: index 5"
}
```

### Events (Pub/Sub)

Fire-and-forget, bidirectional. Frontend ↔ Rust.

**Rust → Frontend:**
```rust
use tauri::Emitter;

#[tauri::command]
fn start_processing(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        for i in 0..100 {
            app.emit("progress", i).unwrap();
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        app.emit("complete", "Done!").unwrap();
    });
}
```

**Frontend listening:**
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen<number>('progress', (event) => {
  setProgress(event.payload);
});

await listen('complete', (event) => {
  console.log(event.payload);
  unlisten(); // cleanup
});
```

**Frontend → Rust:**
```typescript
import { emit } from '@tauri-apps/api/event';
await emit('user-action', { type: 'click', target: 'save' });
```

### Channels (Streaming)

For long-running operations that stream chunks. Better than events for ordered data.

**Rust side:**
```rust
use tauri::ipc::Channel;
use serde::Serialize;

#[derive(Clone, Serialize)]
struct DownloadProgress {
    bytes: u64,
    total: u64,
    filename: String,
}

#[tauri::command]
async fn download_file(url: String, on_progress: Channel<DownloadProgress>) -> Result<String, String> {
    let total = 1_000_000u64;
    for chunk in (0..total).step_by(10000) {
        on_progress.send(DownloadProgress {
            bytes: chunk,
            total,
            filename: "data.zip".into(),
        }).map_err(|e| e.to_string())?;
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    Ok("/path/to/downloaded/file".into())
}
```

**Frontend:**
```typescript
import { invoke, Channel } from '@tauri-apps/api/core';

const onProgress = new Channel<{ bytes: number; total: number; filename: string }>();
onProgress.onmessage = (progress) => {
  const pct = (progress.bytes / progress.total) * 100;
  setDownloadProgress(pct);
};

const path = await invoke<string>('download_file', {
  url: 'https://example.com/data.zip',
  onProgress,
});
```

### Raw Binary Responses

Skip JSON serialization for large payloads:

```rust
use tauri::ipc::Response;

#[tauri::command]
fn read_file_raw(path: String) -> Result<Response, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(Response::new(bytes))
}
```

---

## Three-Tier Security Model

All plugin commands are **BLOCKED by default**. You must explicitly grant access.

### 1. Capabilities (per-window ACLs)

File: `src-tauri/capabilities/default.json`
```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Main window capabilities",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "dialog:allow-open",
    "dialog:allow-save",
    "notification:default",
    {
      "identifier": "fs:scope",
      "allow": [
        { "path": "$APPDATA/**" },
        { "path": "$DOCUMENT/**" }
      ]
    }
  ]
}
```

### 2. Permissions — command-level allow/deny

Each plugin defines granular permissions. Example: `fs:allow-read-text-file` allows reading text files but not binary, not writing, not deleting.

### 3. Scopes — resource-level constraints

Restrict *where* commands can operate. Example: `fs:scope` limits file access to `$APPDATA` and `$DOCUMENT` directories only. Even if a command is allowed, it fails outside the scope.

---

## Project Setup

```bash
npm create tauri-app@latest my-app -- --template react-ts
cd my-app && npm install && npm run tauri dev
```

### Directory Structure
```
src/                        # React frontend
  App.tsx
  main.tsx
  styles.css
src-tauri/
  src/
    lib.rs                  # Commands + state + plugin registration
    main.rs                 # Entry: fn main() { app_lib::run() }
  tauri.conf.json           # App config (window, bundle, security)
  Cargo.toml                # Rust dependencies
  capabilities/
    default.json            # Security capabilities
  icons/                    # App icons (auto-generated)
  build.rs                  # Build script (codegen)
```

### Key tauri.conf.json
```json
{
  "productName": "My App",
  "version": "1.0.0",
  "identifier": "com.myapp.desktop",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  },
  "app": {
    "windows": [
      {
        "title": "My App",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/icon.png"]
  }
}
```

---

## Plugin Ecosystem

| Plugin | Desktop | iOS | Android | Purpose |
|--------|---------|-----|---------|---------|
| `fs` | Yes | Yes | Yes | File system read/write |
| `dialog` | Yes | Yes | Yes | Open/save file dialogs |
| `clipboard-manager` | Yes | Yes | Yes | System clipboard |
| `notification` | Yes | Yes | Yes | Native notifications |
| `http` | Yes | Yes | Yes | HTTP client (bypass CORS) |
| `store` | Yes | Yes | Yes | Persistent key-value storage |
| `sql` | Yes | Yes | Yes | SQLite database |
| `deep-link` | Yes | Yes | Yes | URL scheme handling |
| `shell` | Yes | No | No | Spawn child processes |
| `global-shortcut` | Yes | No | No | Global keyboard shortcuts |
| `updater` | Yes | No | No | Auto-updates with signing |
| `window-state` | Yes | No | No | Remember window position/size |
| `autostart` | Yes | No | No | Launch on system boot |
| `barcode-scanner` | No | Yes | Yes | QR/barcode scanning |
| `biometric` | No | Yes | Yes | Face ID / fingerprint |
| `nfc` | No | Yes | Yes | NFC tag read/write |
| `haptics` | No | Yes | Yes | Vibration feedback |
| `geolocation` | No | Yes | Yes | GPS location |

**Install a plugin:**
```bash
npm run tauri add store
# Adds Rust crate + TypeScript package + updates capabilities
```

---

## State Management

**Rust-side managed state:**
```rust
use std::sync::Mutex;

struct DatabaseConnection { /* ... */ }
struct AppConfig { theme: String, language: String }

tauri::Builder::default()
    .manage(Mutex::new(AppConfig {
        theme: "dark".into(),
        language: "en".into(),
    }))
    .manage(DatabaseConnection::new())
```

**Frontend: use Zustand** (shared with mobile codebase via SK-092):
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LazyStore } from '@tauri-apps/plugin-store';

const tauriStore = new LazyStore('settings.json');

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark' as 'dark' | 'light',
      setTheme: (theme: 'dark' | 'light') => set({ theme }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => ({
        getItem: async (key) => {
          const val = await tauriStore.get<string>(key);
          return val ?? null;
        },
        setItem: async (key, value) => {
          await tauriStore.set(key, value);
          await tauriStore.save();
        },
        removeItem: async (key) => {
          await tauriStore.delete(key);
          await tauriStore.save();
        },
      })),
    }
  )
);
```

---

## Auto-Updater

```rust
// Cargo.toml: tauri-plugin-updater
// capabilities/default.json: "updater:default"

tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
```

**Frontend update check:**
```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update) {
  console.log(`Update ${update.version} available`);
  await update.downloadAndInstall((event) => {
    if (event.event === 'Progress') {
      console.log(`Downloaded ${event.data.chunkLength} bytes`);
    }
  });
  await relaunch();
}
```

---

## Desktop UX Patterns

### System Tray
```rust
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
};

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => app.exit(0),
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        })
        .build(app)?;
    Ok(())
}
```

### Global Shortcuts
```typescript
import { register } from '@tauri-apps/plugin-global-shortcut';

await register('CommandOrControl+Shift+Space', (event) => {
  if (event.state === 'Pressed') {
    toggleQuickInput();
  }
});
```

### Multi-Window
```rust
use tauri::WebviewWindowBuilder;

#[tauri::command]
fn open_settings(app: tauri::AppHandle) -> Result<(), String> {
    WebviewWindowBuilder::new(&app, "settings", tauri::WebviewUrl::App("/settings".into()))
        .title("Settings")
        .inner_size(600.0, 400.0)
        .resizable(false)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

---

## Mobile Support

Tauri 2.0 supports iOS and Android build targets. Use when:
- You need **one codebase for desktop + mobile** with a Rust backend
- Your app is **logic-heavy** (crypto, file processing, data transforms)
- You already have a **web frontend** you want to reuse

Use **Expo/React Native** (SK-058) instead when:
- You need the **full native module ecosystem** (camera, NFC, sensors)
- You need **native UI components** (not WebView-rendered)
- You're building a **mobile-first** experience

---

## Performance Targets

| Target | Value |
|--------|-------|
| Cold startup | <500ms |
| Memory (idle) | <40MB |
| Bundle size | <10MB |
| IPC latency | <5ms per call |

**Optimization checklist:**
- [ ] Lazy-load heavy Rust modules (don't init everything at startup)
- [ ] Defer DB/cache setup until after first paint
- [ ] Code-split frontend (React.lazy, dynamic imports)
- [ ] Batch multiple IPC calls into single commands when possible
- [ ] Use Channels for streaming instead of accumulating data
- [ ] Use raw binary responses for large payloads (skip JSON)
- [ ] Profile with `tokio-console` for async bottlenecks

---

## Integration

- **SK-058** — Universal Conductor routes desktop tasks here
- **SK-089** — Hardware access via Tauri plugins (camera, barcode, biometric)
- **SK-090** — Local-first storage with `tauri-plugin-sql` (SQLite)
- **SK-091** — On-device AI via Rust (llama.cpp bindings, IPC Channels for streaming)
- **SK-092** — Tauri app in a cross-platform monorepo
- **SK-027** — E2E testing for desktop apps
