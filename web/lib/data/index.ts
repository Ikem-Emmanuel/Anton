// Barrel for per-domain mock data. Everything that was in `lib/data.ts`
// re-exports from here so existing `@/lib/data` imports keep working.
// When live data lands, swap any file's contents for a brain/SQLite query
// without touching callers.

export * from './activity';
export * from './agents';
export * from './approvals';
export * from './calendar';
export * from './chat';
export * from './departments';
export * from './documents';
export * from './expenses';
export * from './inbox';
export * from './integrations';
export * from './memory';
export * from './people';
export * from './primitives';
export * from './research';
export * from './tasks';
export * from './travel';
export * from './usage';
