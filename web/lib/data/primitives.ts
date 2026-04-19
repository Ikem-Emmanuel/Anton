// Cross-domain primitives. Kept tiny — adds only when a type is genuinely
// shared between unrelated domains (e.g. Risk is used by both approvals
// and tasks).

export type Risk = 'L' | 'M' | 'H';
