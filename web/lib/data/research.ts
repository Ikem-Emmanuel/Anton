export type StudyStatus = 'done' | 'running' | 'needs review';
export type StudyDepth = 'quick' | 'medium' | 'deep';

export type Study = {
  id: number;
  q: string;
  status: StudyStatus;
  depth: StudyDepth;
  who: string;
  t: string;
  sources: number;
  /** Runtime display (e.g. "8m 22s" or "running…"). */
  runtime: string;
  /** Progress for running studies. */
  pct?: number;
  /** The rendered answer body. */
  answer: string;
  /** Ordered reasoning chain. */
  reasoning: string[];
  /** Source citations. */
  sourceList: string[];
};

export const STUDIES: Study[] = [
  {
    id: 0,
    q: 'What would creator-tier pricing look like for our market?',
    status: 'done',
    depth: 'deep',
    who: 'Alex',
    t: '1h',
    sources: 14,
    runtime: '8m 22s',
    answer:
      'A three-tier structure at $9 / $19 / $49 aligns with comp-set anchors (Raycast $8, Notion $10, Arc $20). At $19/mo we can support up to 500 local-agent operations/day while maintaining ~40% gross margin. Recommend free tier capped at 50 ops/day with a visible usage meter — this converted 11% in the closest analog (Raycast Pro).',
    reasoning: [
      'Pulled comp-set pricing from 9 direct and adjacent tools',
      'Cross-referenced with our cohort LTV from Priya',
      'Modeled three scenarios, ran sensitivity on conversion rate',
      'Stress-tested gross margin at 80/20 free/paid split',
    ],
    sourceList: [
      'Raycast pricing page',
      'Notion billing FAQ',
      'Stripe Atlas pricing guide 2024',
      'Priya · retention cohort v3',
      'Arc Browser press kit',
      'Hacker News thread · Feb 2025',
    ],
  },
  {
    id: 1,
    q: 'How is Readwise positioning against Reader and Notion?',
    status: 'done',
    depth: 'medium',
    who: 'Sarah',
    t: '4h',
    sources: 9,
    runtime: '3m 18s',
    answer:
      "Readwise is positioning on breadth of capture (everything you read ends up here). Reader is positioning on reading experience. Notion is positioning on structured thinking. The white space: what you do with it. That's where Anton sits.",
    reasoning: [
      'Reviewed public homepage copy + onboarding flows',
      'Compared feature matrices across all three tools',
      'Pulled positioning signals from investor letters + podcasts',
    ],
    sourceList: ['Readwise homepage', 'Reader beta announcement', 'Notion AI launch post', 'Lenny podcast · Jan 2025'],
  },
  {
    id: 2,
    q: 'Retention cohorts for launch week — early patterns',
    status: 'running',
    depth: 'deep',
    who: 'Priya',
    t: '12m',
    sources: 0,
    runtime: 'running…',
    pct: 38,
    answer: 'Priya is running the retention SQL now. Early signal: day-1 activation up 18% vs last week. Day-7 TBD.',
    reasoning: ['Running SQL across week-16 cohort', 'Cross-referencing with launch email open data'],
    sourceList: [],
  },
  {
    id: 3,
    q: 'Anna Kou — public writing, recent talks',
    status: 'done',
    depth: 'quick',
    who: 'Noel',
    t: '1d',
    sources: 6,
    runtime: '44s',
    answer:
      'Anna is VP Eng at Spark. Recent posts focus on on-device ML inference costs. Spoke at Strange Loop last year on local-first architecture.',
    reasoning: ['Scanned public blog + newsletter archive', 'Pulled conference talks from last 18 months'],
    sourceList: ['Personal blog', 'Strange Loop 2024 talk', 'Twitter / X'],
  },
  {
    id: 4,
    q: 'Legal: GDPR implications of on-device memory',
    status: 'needs review',
    depth: 'deep',
    who: 'Diana',
    t: '2d',
    sources: 18,
    runtime: '14m 02s',
    answer:
      'On-device memory meaningfully reduces but does not eliminate data-controller obligations. Diana flagged three questions that need external counsel review before we advertise "GDPR-native" positioning.',
    reasoning: [
      'Mapped our data flows against GDPR Articles 5, 6, 32',
      'Compared against on-device precedent (Apple, Signal)',
      'Identified three gray areas for external counsel review',
    ],
    sourceList: ['GDPR full text', 'Apple privacy whitepaper', 'Signal protocol docs'],
  },
  {
    id: 5,
    q: 'State of local-first LLM inference on Apple Silicon',
    status: 'done',
    depth: 'deep',
    who: 'Ada',
    t: '3d',
    sources: 22,
    runtime: '11m 45s',
    answer:
      'M-series unified memory is transformative for 13B–70B class models. MLX closes the gap with CUDA for batch=1 inference. Ollama + llama.cpp remain the easiest deploy target.',
    reasoning: [
      'Benchmarked MLX vs llama.cpp on M4 Max',
      'Reviewed Ollama + LM Studio + Jan architectures',
      'Pulled memory/throughput curves from published datasets',
    ],
    sourceList: ['MLX repo', 'Ollama blog', 'llama.cpp perf dashboards', 'MacRumors M-series benchmarks'],
  },
];
