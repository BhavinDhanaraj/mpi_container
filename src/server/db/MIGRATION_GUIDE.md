# PostgreSQL Migration Guide

This application is architected from Day 1 to be directly migratable to a relational PostgreSQL database.

## 1. Schema DDL
The full DDL is located in `schema.sql`:
- `transitional_facility_sites`: Site details (NIDC Wiri #297, SIDC Hornby #298, etc.)
- `yard_containers`: Active containers on site with current BACC, flags, condition, packages, vessel, supplier.
- `bacc_history`: Immutable log of every BACC received for a container. The latest record by `received_time` dictates the status.
- `checked_out_containers`: Containers emptied and checked out via WMS.
- `agent_runs`: Audit trail of the compliance agent's scheduled mailbox polls, gate arrivals, and checkouts.
- `agent_events`: Event timeline of all state transitions.

## 2. Pluggable Repository Interface
All application logic and API endpoints interact exclusively through the `ComplianceRepository` interface defined in `src/server/db/repository.ts`:
- `getYardContainers(filter)`
- `getContainer(containerNumber)`
- `getCheckedOutContainers(search)`
- `getSummary()`
- `getRuns()`
- `getEvents()`
- `gateInContainer(container)`
- `updateContainerBacc(containerNumber, update)`
- `checkoutContainer(containerNumber)`
- `triggerPoll()`

## 3. Switching to PostgreSQL
1. Run `schema.sql` against your Postgres database (e.g. Supabase, Neon, Cloud SQL, AWS RDS):
   ```bash
   psql $DATABASE_URL -f src/server/db/schema.sql
   ```
2. In `src/server/db/repository.ts`, provide a `PostgresComplianceRepository` implementing `ComplianceRepository` using the `pg` driver or an ORM like Drizzle.
3. Toggle the export:
   ```ts
   export const repository: ComplianceRepository = process.env.DATABASE_URL
     ? new PostgresComplianceRepository(process.env.DATABASE_URL)
     : new InMemoryComplianceRepository();
   ```
No frontend changes or API route updates are required.
