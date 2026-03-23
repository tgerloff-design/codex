# Weekly Workload App

Production-ready full-stack app for visualizing weekly workload trends using either SSRS report data or direct SQL Server access.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Charting: Recharts
- DB access: mssql (SQL Server)
- Validation: zod
- Tests: vitest (weekly aggregation)

## Project structure
- `client/` React app
- `server/` API service and providers
- `shared/` shared TypeScript contracts

## API
- `GET /api/resources?mode=db|ssrs`
- `POST /api/workload`
  ```json
  {
    "mode": "ssrs",
    "resourceIds": ["u1", "u2"],
    "startDate": "2026-01-01",
    "endDate": "2026-03-01"
  }
  ```

Response shape:
```json
{
  "weeks": [
    {
      "weekStart": "2026-02-09",
      "weekEnd": "2026-02-15",
      "weekLabel": "2026-W07 (Feb 9)",
      "total": 42,
      "byResource": { "u1": 20, "u2": 22 }
    }
  ],
  "summary": {
    "total": 42,
    "averageWeekly": 21,
    "peakWeek": { "weekLabel": "2026-W07 (Feb 9)", "value": 42 },
    "lowWeek": { "weekLabel": "2026-W08 (Feb 16)", "value": 0 }
  }
}
```

## Setup
1. Copy `.env.example` to `.env`.
2. Set either DB config, SSRS config, or both.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run both apps:
   ```bash
   npm run dev
   ```
5. Open frontend on `http://localhost:5173`.

## Environment variables
See `.env.example` for all values.

### DB mode
Required:
- `DB_SERVER`
- `DB_DATABASE`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ENCRYPT`

The SQL query in `server/src/services/dbProvider.ts` is intentionally documented and parameterized. Update table/column names to match your schema.

### SSRS mode
Required:
- `SSRS_BASE_URL`
- `SSRS_REPORT_PATH`
- `SSRS_FORMAT` (`csv|json|xml`)

Optional:
- `SSRS_USERNAME`, `SSRS_PASSWORD`, `SSRS_DOMAIN`

The server passes `StartDate`, `EndDate`, and repeated `ResourceId` report params. Adjust to your report parameter names if needed.

## SSRS authentication notes
SSRS auth is environment-specific:
- Basic auth works only when SSRS is configured for Basic.
- Many enterprise SSRS setups require NTLM or Kerberos.

This project includes a pluggable interface:
- `server/src/services/types.ts` exposes `SsrsAuthProvider`.
- `BasicAuthProvider` is implemented.
- `PluggableAuthProvider` is a stub for NTLM/Kerberos integration.

To adapt for NTLM/Kerberos, replace `PluggableAuthProvider` in `server/src/services/ssrsProvider.ts` with your org's auth mechanism (for example using a reverse proxy, service account, or custom client middleware).

## Validation and guards
Backend validates:
- Date format (`YYYY-MM-DD`)
- `startDate <= endDate`
- Max date range (`MAX_DATE_RANGE_DAYS`, default 730)

## Tests
Run aggregation unit tests:
```bash
npm test
```

## Replit instructions
1. Create a new Replit project from this repo/files.
2. Add secrets from `.env.example` into Replit Secrets.
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. In Replit, expose both ports if needed:
   - Frontend: `5173`
   - Backend: `4000`

If Replit supports one exposed port only, run backend on `3000` and set `VITE_API_BASE_URL` accordingly.