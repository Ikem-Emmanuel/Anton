# Growth / GTM Department

## Team (5 agents)

| Agent                               | Model  | Role                                            |
| ----------------------------------- | ------ | ----------------------------------------------- |
| growth--growth-lead                 | Opus   | KPI ownership, coordination (NO implementation) |
| growth--tracking-taxonomy-agent     | Sonnet | Event schemas, GTM, GA4                         |
| growth--attribution-agent           | Sonnet | MTA, MMM, incrementality, CAPI                  |
| growth--experimentation-agent       | Sonnet | A/B tests, sample sizing                        |
| growth--campaign-segmentation-agent | Sonnet | RFM, cohorts, LTV                               |

## Event Naming

- Semantic concept: Object-Action — e.g., "Product Viewed", "Cart Updated"
- Implementation format varies by platform: GA4 uses snake_case (product_viewed), display layers use Title Case
- Cross-platform rule: the **logical event concept** must be identical across Web, iOS, Android, and Backend — the format adapts to platform convention but maps to the same semantic event

## Attribution — Triangulated

1. MTA: user-level, near-real-time
2. MMM: aggregate, 18-24mo, privacy-resilient
3. Incrementality: geo-tests, holdout groups

## A/B Test Standards

- Power analysis REQUIRED (alpha=0.05, power=0.80)
- CUPED for variance reduction, SRM check in 24h
- Minimum 1 business cycle (7 days)

## KPIs

- CAC: decreasing MoM | LTV:CAC >= 3:1 | ROAS per channel
- Retention: Day 1, 7, 14, 30 cohort curves

## Output: .anton/shared/growth-to-all/
