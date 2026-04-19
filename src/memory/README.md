# Memory

> Stores, indexes, recalls, and forgets. Anton's knowledge layer.

## What It Does

Memory is how Anton remembers everything — conversations, decisions, patterns, preferences, code, and documents. It stores knowledge across four systems, each optimized for a different retrieval pattern. It also maintains the Obsidian vault as the human-readable layer: if Anton goes down, your notes are still usable plain text.

```
New information arrives
  -> memory.store()       Save to SQLite (crash-safe)
  -> memory.embed()       Index into ChromaDB (semantic search)
  -> memory.graph()       Extract entities into LightRAG (relationships)
  -> memory.vault()       Write to Obsidian (human-readable)

Query arrives
  -> memory.recall()      Hybrid search: FTS5 + vector + graph
  -> memory.rank()        Rerank top 50 -> top 5 most relevant
  -> return context       Injected into brain's prompt
```

## Responsibilities

| Function | Description |
|----------|-------------|
| Store conversations | Every agent interaction summarized and persisted |
| Store decisions | Architecture decisions, preferences, corrections |
| Store patterns | "Noel checks PRs at 10am", "always use JWT for auth" |
| Semantic search | "Find everything about the auth module" -> relevant chunks |
| Relational queries | "Which modules depend on the service changed last sprint?" |
| Vault management | Read/write Obsidian notes with proper frontmatter + wikilinks |
| Context injection | Before every brain response, inject relevant memories |
| Memory consolidation | Hourly: entity extraction. Daily: summaries. Weekly: training data |
| Forgetting | Prune old, low-relevance memories to keep context manageable |

## Storage Layers

| Layer | Technology | What it stores | Query speed | Update speed |
|-------|-----------|---------------|-------------|-------------|
| Relational | SQLite + FTS5 + WAL | Conversations, tasks, training data | <50ms | Instant |
| Vector | ChromaDB | Embeddings for semantic search | <200ms | Seconds |
| Graph | LightRAG | Entity relationships, multi-hop reasoning | <500ms | Hourly batch |
| Human-readable | Obsidian Vault (Markdown) | Notes, decisions, dailies, research | N/A (human reads) | Instant |

## How It Communicates

### Receives from:
- **Brain** — "store this conversation summary", "recall context for this query"
- **Heart** (briefing) — "get today's daily note content"
- **Hands** (executor) — "store the result of this Claude call"
- **Nervous** (event bus) — system events to log

### Sends to:
- **Brain** — context chunks before every response
- **Heart** (briefing) — data for morning briefing, weekly review
- **Spine** (training) — curated training data for self-improvement

### Interfaces:
```typescript
// Store
memory.store(agentId: string, type: MemoryType, content: string, metadata?: object): string
memory.storeConversation(sessionId: string, messages: Message[]): void
memory.vaultWrite(path: string, content: string, frontmatter: object): void

// Recall
memory.recall(query: string, options?: { agent?: string, limit?: number }): MemoryChunk[]
memory.search(query: string): SearchResult[]           // FTS5 keyword
memory.semantic(query: string, topK?: number): Chunk[]  // ChromaDB vector
memory.graph(query: string): GraphResult[]              // LightRAG relational
memory.vaultRead(path: string): VaultNote

// Maintain
memory.consolidate(): void       // Hourly: extract entities, update graph
memory.summarizeDay(): string    // Daily: generate day summary
memory.curateTraining(): DPOPair[] // Weekly: generate training pairs
memory.prune(olderThan: Date): number // Remove stale memories
```

## How It Scales

| Data volume | Performance | Action needed |
|------------|-------------|---------------|
| <10K memories | Instant (<50ms) | None |
| 10K-100K | Fast (<200ms) | Ensure indexes exist |
| 100K-1M | Acceptable (<500ms) | Prune old memories, optimize embeddings |
| >1M | Needs attention | Archive to cold storage, shard ChromaDB |

SQLite handles millions of rows effortlessly. ChromaDB scales to ~1M vectors on a single machine. LightRAG is the bottleneck — keep the graph focused on recent/relevant entities.

## Obsidian Vault

The vault is the shared language between you and Anton. Both read and write the same Markdown files.

```
~/vault/
  00-Inbox/          Capture everything here first
  01-Projects/       Active project folders
  02-Areas/          Ongoing responsibilities
  03-Resources/      Reference material
  04-Archive/        Completed/inactive
  Decisions/         Architecture Decision Records
  Daily/             Auto-generated daily notes
  Agents/            Agent conversation summaries
  Templates/         Note templates
```

**Vault watcher**: chokidar monitors `~/vault/**/*.md`. Any file change triggers re-embedding into ChromaDB within 2 seconds.

**Vault sync**: Git commit of vault changes runs daily as backup.

## Crash Safety

- SQLite uses WAL (Write-Ahead Logging) — writes survive `kill -9`
- ChromaDB persists to disk after every batch
- Vault is plain files — always recoverable
- No JSON files for state (the V1 vulnerability)

## Memory Injection Scanning

Before storing any memory, scan for prompt injection patterns:
- "Ignore previous instructions"
- Invisible Unicode characters
- Credential exfiltration attempts
- Strings that look like system prompts

Reject and log any flagged content.

## Dependencies

- better-sqlite3 (SQLite driver)
- ChromaDB (vector store, Docker container)
- LightRAG (knowledge graph, Docker or local)
- chokidar (vault file watcher)
- nomic-embed-text (embeddings via Ollama)
- Brain organ (sends queries, receives context)
- Heart organ (briefing reads daily/weekly summaries)

## Files

```
src/memory/
  README.md           This file
  sqlite.ts           SQLite CRUD with WAL, FTS5, indexes
  rag.ts              ChromaDB client, hybrid search, reranking
  graph.ts            LightRAG knowledge graph
  vault.ts            Obsidian vault read/write with frontmatter
  vault-watcher.ts    chokidar file watcher for real-time reindexing
  vault-sync.ts       Git commit vault changes daily
  scanner.ts          Memory injection scanning
  consolidate.ts      Hourly/daily/weekly memory maintenance
  memory.test.ts      Tests
  vault.test.ts       Vault-specific tests
```

## Configuration

```typescript
// config/memory.ts
export const memoryConfig = {
  sqlite: { path: 'data/brain/anton.db', walMode: true, busyTimeout: 5000 },
  chromadb: { url: 'http://localhost:8000', collection: 'anton_knowledge' },
  lightrag: { url: 'http://localhost:9621' },
  vault: { path: '~/vault', watchGlob: '**/*.md', gitBackup: true },
  embedding: { model: 'nomic-embed-text', chunkSize: 512, overlap: 50 },
  pruning: { maxAge: '90d', minRelevance: 0.3 },
};
```
