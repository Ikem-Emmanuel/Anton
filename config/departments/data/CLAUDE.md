# Data Department

## Team (4 agents)

| Agent               | Model  | Role                                       |
| ------------------- | ------ | ------------------------------------------ |
| data--data-lead     | Opus   | Strategy, coordination (NO implementation) |
| data--data-analyst  | Haiku  | SQL queries, BI reporting                  |
| data--ml-engineer   | Sonnet | Model training, experiments                |
| data--data-engineer | Sonnet | ETL pipelines, schemas                     |

## SQL Conventions

- CTEs over subqueries, uppercase keywords, lowercase identifiers
- Always LIMIT during exploration, never SELECT \* in production
- Parameterized queries only
- All SQLite writes through writeTransaction()

## Pipeline Standards

- Idempotent, incremental, logged (start, end, rows, errors)

## ML Experiment Format

Document: hypothesis, dataset version, hyperparameters, metrics, baseline, seed.
Save to: .anton/departments/data/experiments/YYYY-MM-DD-name.md

## Output: .anton/shared/data-to-all/
