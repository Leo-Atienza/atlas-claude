<!--
id: SK-090
name: local-first-architecture
description: Local-First Architecture — offline-first patterns with CRDT sync. PowerSync (enterprise Postgres/MongoDB), TinyBase v5 (~5kb CRDT), Legend State v3 (signals + sync), ElectricSQL (Postgres shapes). Complete patterns for optimistic UI, conflict resolution, sync strategies.
keywords: local-first, offline-first, crdt, sync, powersync, tinybase, legend-state, electricsql, offline, realtime, conflict-resolution, optimistic-ui, sync-engine, sqlite
version: 1.0.0
-->

# Local-First Architecture

## When to Use This Skill

**Auto-activate when:** building offline-capable apps, implementing sync between devices, collaborative editing, handling intermittent connectivity, or any local-first data architecture. SK-058 (Universal Conductor) routes here.

---

## The Local-First Decision Tree

```
Does the app need to work offline?
├── No, always online
│   └── TanStack Query + server state is sufficient (SK-055)
├── Read-only offline
│   └── TanStack Query + MMKV persister (already in SK-058)
└── Read + write offline → YOU NEED THIS SKILL
    ├── Single user, simple sync
    │   └── TinyBase v5 (~5kb) or Legend State v3 (~4kb)
    ├── Multi-user, conflict resolution needed
    │   └── PowerSync (enterprise) or ElectricSQL (Postgres)
    └── Collaborative real-time editing
        └── CRDT library (Yjs or Automerge) + custom sync
```

---

## Sync Engine Comparison

| Engine | Bundle | Backend | Sync Model | Conflict | RN | Best For |
|--------|--------|---------|------------|----------|----|----------|
| PowerSync | ~50kb | Postgres, MongoDB, MySQL | Bucket-based partial sync | LWW + custom | Yes | Enterprise, existing Postgres |
| TinyBase v5 | ~5kb | Any (CRDT built-in) | CRDT merge (MergeableStore) | Automatic LWW | Yes | Small apps, simple schemas |
| Legend State v3 | ~4kb | Supabase, Firebase, custom | Signals + built-in sync | Optimistic + configurable | Yes | RN/Expo, reactive UI |
| ElectricSQL | ~30kb | Postgres only | Shape-based sync + CDN | Server-authoritative | Partial | Read-heavy, Postgres shapes |

---

## PowerSync Deep Dive

### Setup with Supabase

```bash
npm install @powersync/react-native @powersync/common
```

**Schema definition:**
```typescript
// lib/powersync-schema.ts
import { column, Schema, Table } from '@powersync/common';

const tasks = new Table({
  title: column.text,
  completed: column.integer, // 0 or 1
  created_at: column.text,
  updated_at: column.text,
  user_id: column.text,
});

const projects = new Table({
  name: column.text,
  color: column.text,
});

export const schema = new Schema({ tasks, projects });
```

**Database setup:**
```typescript
// lib/powersync.ts
import { PowerSyncDatabase } from '@powersync/react-native';
import { SupabaseConnector } from './supabase-connector';
import { schema } from './powersync-schema';

export const db = new PowerSyncDatabase({
  schema,
  database: { dbFilename: 'app.db' },
});

const connector = new SupabaseConnector();
await db.connect(connector);
```

**Supabase connector:**
```typescript
// lib/supabase-connector.ts
import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from '@powersync/common';
import { supabase } from './supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL!,
      token: session?.access_token ?? '',
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const batch = await database.getCrudBatch(100);
    if (!batch) return;

    for (const op of batch.crud) {
      await this.applyOperation(op);
    }
    await batch.complete();
  }

  private async applyOperation(op: CrudEntry) {
    const table = op.table;
    switch (op.op) {
      case UpdateType.PUT:
        await supabase.from(table).upsert({ id: op.id, ...op.opData });
        break;
      case UpdateType.PATCH:
        await supabase.from(table).update(op.opData!).eq('id', op.id);
        break;
      case UpdateType.DELETE:
        await supabase.from(table).delete().eq('id', op.id);
        break;
    }
  }
}
```

**CRUD operations (fully offline-capable):**
```typescript
// All writes go to local SQLite first, sync happens in background
await db.execute(
  'INSERT INTO tasks (id, title, completed, created_at, user_id) VALUES (uuid(), ?, 0, datetime(), ?)',
  ['Buy groceries', userId]
);

// Reads are always local — instant
const tasks = await db.getAll<Task>(
  'SELECT * FROM tasks WHERE completed = 0 ORDER BY created_at DESC'
);

// Watch for changes (reactive)
const watch = db.watch('SELECT * FROM tasks ORDER BY created_at DESC');
for await (const results of watch) {
  setTasks(results.rows?._array ?? []);
}
```

---

## TinyBase v5 Deep Dive

```bash
npm install tinybase
```

**CRDT-enabled store:**
```typescript
import { createMergeableStore } from 'tinybase';
import { createExpoSqlitePersister } from 'tinybase/persisters/persister-expo-sqlite';
import { createWsSynchronizer } from 'tinybase/synchronizers/synchronizer-ws-client';
import * as SQLite from 'expo-sqlite';

// Create CRDT store — same API as regular store
const store = createMergeableStore('client-1');

// Define tables
store.setTablesSchema({
  tasks: {
    title: { type: 'string' },
    completed: { type: 'boolean', default: false },
    priority: { type: 'number', default: 0 },
  },
});

// Persist to SQLite
const sqliteDb = SQLite.openDatabaseSync('app.db');
const persister = createExpoSqlitePersister(store, sqliteDb, 'tinybase_data');
await persister.startAutoLoad();
await persister.startAutoSave();

// Sync via WebSocket — automatic CRDT merge
const synchronizer = await createWsSynchronizer(store, new WebSocket('wss://sync.example.com'));
await synchronizer.startSync();
```

**Operations:**
```typescript
// Write — instant local, syncs automatically
store.setRow('tasks', 'task-1', {
  title: 'Buy groceries',
  completed: false,
  priority: 1,
});

// Read
const task = store.getRow('tasks', 'task-1');

// React hook
import { useRow, useTable } from 'tinybase/ui-react';

function TaskList() {
  const tasks = useTable('tasks');
  return Object.entries(tasks).map(([id, task]) => (
    <TaskItem key={id} id={id} task={task} />
  ));
}
```

---

## Legend State v3 Deep Dive

```bash
npm install @legendapp/state @legendapp/state/react
```

**Signal-based reactive state with sync:**
```typescript
import { observable, syncObservable } from '@legendapp/state';
import { configureSynced } from '@legendapp/state/sync';
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { supabase } from './supabase';

// Configure global persistence
configureSynced({
  persist: { plugin: ObservablePersistMMKV },
});

// Observable with built-in Supabase sync
const tasks$ = observable(
  syncedSupabase({
    supabase,
    collection: 'tasks',
    select: (from) => from.select('*').order('created_at', { ascending: false }),
    actions: ['read', 'create', 'update', 'delete'],
    realtime: true,
    persist: { name: 'tasks', retrySync: true },
    retry: { infinite: true },
  })
);
```

**React components with fine-grained reactivity:**
```tsx
import { observer, Memo } from '@legendapp/state/react';
import { tasks$ } from '../stores/tasks';

const TaskList = observer(function TaskList() {
  const tasks = tasks$.get();
  return (
    <FlatList
      data={Object.values(tasks ?? {})}
      renderItem={({ item }) => (
        <Memo>{() => <TaskItem task={item} />}</Memo>
      )}
    />
  );
});

// Memo re-renders ONLY when that specific task changes
const TaskItem = observer(function TaskItem({ task }: { task: Task }) {
  return (
    <View>
      <Text>{task.title}</Text>
      <Switch
        value={task.completed}
        onValueChange={(v) => {
          // Direct mutation — signals propagate automatically
          tasks$[task.id].completed.set(v);
        }}
      />
    </View>
  );
});
```

---

## Architecture Patterns

### Optimistic UI with Rollback

```typescript
async function toggleTask(taskId: string, currentValue: boolean) {
  // 1. Optimistic update (instant)
  const newValue = !currentValue;
  store.setCell('tasks', taskId, 'completed', newValue);
  haptics.tap();

  try {
    // 2. Server sync (background)
    await supabase.from('tasks').update({ completed: newValue }).eq('id', taskId);
  } catch (error) {
    // 3. Rollback on failure
    store.setCell('tasks', taskId, 'completed', currentValue);
    haptics.error();
    showToast('Failed to update. Reverted.');
  }
}
```

### Offline Mutation Queue

```typescript
class OfflineMutationQueue {
  private queue: Mutation[] = [];

  async enqueue(mutation: Mutation) {
    this.queue.push(mutation);
    await this.persist();
    this.attemptSync();
  }

  private async attemptSync() {
    while (this.queue.length > 0 && navigator.onLine) {
      const mutation = this.queue[0];
      try {
        await this.execute(mutation);
        this.queue.shift();
        await this.persist();
      } catch (error) {
        if (!isRetryable(error)) {
          this.queue.shift(); // Dead-letter
          await this.persist();
        }
        break; // Stop processing, retry later
      }
    }
  }
}
```

### Sync Status Indicator

```tsx
function SyncIndicator() {
  const syncStatus = useSyncStatus(); // 'synced' | 'syncing' | 'offline' | 'error'

  const colors = {
    synced: '#22c55e',
    syncing: '#eab308',
    offline: '#94a3b8',
    error: '#ef4444',
  };

  return (
    <View style={styles.indicator}>
      <View style={[styles.dot, { backgroundColor: colors[syncStatus] }]} />
      <Text style={styles.label}>
        {syncStatus === 'synced' ? 'Saved' :
         syncStatus === 'syncing' ? 'Syncing...' :
         syncStatus === 'offline' ? 'Offline' : 'Sync error'}
      </Text>
    </View>
  );
}
```

---

## sqlite-vec Integration

On-device vector search alongside CRDT sync (Expo SDK 54):

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('app.db');

// Enable sqlite-vec extension
db.execSync('SELECT load_extension("vec0")');

// Create vector table
db.execSync(`
  CREATE VIRTUAL TABLE IF NOT EXISTS doc_embeddings USING vec0(
    document_id TEXT PRIMARY KEY,
    embedding FLOAT[384]
  )
`);

// Insert embedding
db.runSync(
  'INSERT INTO doc_embeddings (document_id, embedding) VALUES (?, ?)',
  [docId, JSON.stringify(embedding)]
);

// Similarity search
const results = db.getAllSync<{ document_id: string; distance: number }>(
  `SELECT document_id, distance
   FROM doc_embeddings
   WHERE embedding MATCH ?
   ORDER BY distance
   LIMIT 5`,
  [JSON.stringify(queryEmbedding)]
);
```

---

## Integration

- **SK-058** — Universal Conductor routes offline/sync tasks here
- **SK-055** — TanStack Query for server-state-only (no offline write needed)
- **SK-091** — On-device AI with locally stored data (RAG pipeline)
- **SK-092** — Sharing sync logic across platforms in a monorepo
- **SK-088** — Tauri SQL plugin for desktop local-first apps
