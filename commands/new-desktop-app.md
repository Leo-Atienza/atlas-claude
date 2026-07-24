# /new-desktop-app -- Scaffold a Tauri desktop project

You are handling: **$ARGUMENTS**

Execute autonomously from start to finish. Do not ask for permission to use tools, run validations, or invoke skills.

---

## Step 1 -- Scaffold Tauri project

If Tauri MCP available, use it. Otherwise:

```bash
npm create tauri-app@latest <project-name> -- --template react-ts
cd <project-name>
npm install
```

If no project name provided, ask one question: "What should I name the app?"

## Step 2 -- Load desktop context

There is no dedicated Tauri *skill* in the active registry (the SK-088 engine is archived). Use these instead:
1. **`tauri-mcp` MCP** -- drive and verify the running app: webview DOM snapshot, execute JS, IPC command/event capture, screenshot, driver session.
2. **Context7** -- `resolve-library-id` -> `get-library-docs` for current Tauri 2 docs before writing `tauri.conf.json`, capabilities, or IPC.
3. `<your-vault-path>/wiki/app-dev/stack.md` + `capability-map.md` -- the verified Tauri 2 facts (2.11.x line, GA since 2024-10-02, iOS/Android first-class, capabilities/permissions ACL security model) and the desktop routing.

## Step 3 -- Install frontend dependencies

```bash
npm install @tauri-apps/api @tauri-apps/plugin-shell @tauri-apps/plugin-dialog @tauri-apps/plugin-store
npm install -D tailwindcss @tailwindcss/vite
```

Set up Tailwind:
1. Add `@tailwindcss/vite` plugin to `vite.config.ts`
2. Add `@import "tailwindcss"` to main CSS file

## Step 4 -- Configure Tauri

1. Edit `src-tauri/tauri.conf.json`:
   - Set `identifier` to reverse-domain format
   - Set window title, default dimensions (1024x768), min size
   - Configure CSP for security
2. Edit `src-tauri/capabilities/default.json`:
   - Scope permissions to minimum required
   - Add plugin permissions as needed
3. Set up basic IPC command in `src-tauri/src/lib.rs`:
   ```rust
   #[tauri::command]
   fn greet(name: &str) -> String {
       format!("Hello, {}!", name)
   }
   ```

## Step 5 -- Install common Tauri plugins

Based on project needs (ask if unclear):

| Plugin | Use case |
|--------|----------|
| `tauri-plugin-store` | Persistent key-value storage |
| `tauri-plugin-dialog` | Native file/folder/save dialogs |
| `tauri-plugin-notification` | System notifications |
| `tauri-plugin-shell` | Execute system commands |
| `tauri-plugin-autostart` | Launch on system boot |
| `tauri-plugin-updater` | Auto-update mechanism |

Install Rust side:
```bash
cd src-tauri
cargo add tauri-plugin-store tauri-plugin-dialog
cd ..
```

Register in `src-tauri/src/lib.rs`:
```rust
tauri::Builder::default()
    .plugin(tauri_plugin_store::init())
    .plugin(tauri_plugin_dialog::init())
```

## Step 6 -- Set up state management

Create `src/stores/` with:
- App state using Zustand or TanStack Store
- Tauri store persistence layer (bridge JS state <-> tauri-plugin-store)

## Step 7 -- Generate project CLAUDE.md

Create a project-specific CLAUDE.md with:
- Stack: Tauri 2.x + React + TypeScript + Tailwind
- IPC patterns: Commands for request/response, Events for broadcasts, Channels for streams
- Security: capability-based permissions, CSP configuration
- Build: `cargo tauri dev` for development, `cargo tauri build` for production

## Step 8 -- Quality gates

- Use Tauri MCP or run `npx tauri dev` to verify app launches
- Run `npx tsc --noEmit` for TypeScript check
- Run `cd src-tauri && cargo check` for Rust check
- Security: sharp-edges on IPC handlers (verify capability boundaries)

## Step 9 -- Wrap up

- Init git repo if not already in one
- Ask: "Ready to commit? [y/n]"
- Summarize: what was built, next steps (add features, configure updater, package for distribution)
