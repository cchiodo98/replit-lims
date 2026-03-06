# ChemLIMS - Chemistry Laboratory Information Management System

## Overview
ChemLIMS is a full-stack Chemistry Laboratory Information Management System designed for comprehensive management of chemistry samples, test definitions, material types with configurable test packages, and test results. It aims to streamline laboratory operations by providing features such as auto-generated sample IDs, barcode and QR code printing, a configurable material type system, and a lab manager dashboard with analytics (turnaround times, status breakdown, completion rates, out-of-spec alerts). The system supports detailed sample views, individual test result entry, verification workflows, and hierarchical storage location management. Core ambitions include improving efficiency, accuracy, and data accessibility within chemistry laboratories, offering market potential in scientific research, quality control, and industrial chemistry sectors.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Structure
- **Monorepo** with `client/` (React SPA), `server/` (Express API), and `shared/` (shared types, schemas, API contracts).
- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Express.js on Node with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Shared Layer**: `shared/schema.ts` for Drizzle table definitions and Zod validation, `shared/routes.ts` for typed API contracts.

### Frontend Architecture
- **UI/UX**: Chemistry/lab professional theme (emerald/gray palette) with Tailwind CSS and shadcn/ui (New York style). Custom sidebar navigation.
- **Routing**: `wouter`.
- **State/Data Fetching**: `@tanstack/react-query`.
- **Forms**: `react-hook-form` with Zod validation.
- **Animations**: `framer-motion`.
- **Charts**: `recharts` for dashboard analytics.
- **Barcodes/QR Codes**: `jsbarcode` for barcode generation, `qrcode` for QR code generation.
- **Authentication**: Protected routes redirect to `/auth`.
- **Key Pages**:
    - **Dashboard**: Lab manager overview with statistics, charts, and recent activity.
    - **Sample Management**: Filterable list, creation, receiving, and detailed views.
    - **Test Catalog**: Management of chemistry test definitions.
    - **Material Types**: Configuration of material types and default test packages.
    - **Storage Locations**: Hierarchical management of lab storage.
    - **Shipping / Sample Submission**: Generation and tracking of sample submission forms.
    - **Reporting Module**: Customizable report templates (Certificate of Analysis, Summary Report, Detailed Lab Report) with configurable sections, columns, filters, and PDF generation.
    - **Settings**: Profile editing, password changes, theme picker, lab configuration (admin), barcode/QR code label printing presets.

### Backend Architecture
- **API**: Express.js server with JSON/URL-encoded body parsing, all routes prefixed with `/api/`.
- **Storage Layer**: `server/storage.ts` implementing `IStorage` interface with Drizzle ORM.
- **Development**: Vite dev server mounted as middleware for HMR.
- **Production**: Static files served from `dist/public/` with SPA fallback.

### Database Schema (Core Entities)
- `materialTypes`, `materialTypeTests`, `testDefinitions`
- `samples`, `sampleTests`, `sampleIdSequence`, `prepColumns`, `samplePreparations`, `savedPrepViews`
- `storageLocations`
- `report_templates`
- `projects`
- Auth tables: `sessions`, `users`

### API Contract
- Comprehensive CRUD operations for `materialTypes`, `testDefinitions`.
- Sample management (`samples.list`, `samples.get`, `samples.create`, `samples.updateStatus`).
- Test result entry and verification (`sampleTests.updateResult`, `sampleTests.verify`).
- Dashboard statistics (`dashboard.stats`).
- Authentication endpoints (`auth.*`).
- Reporting endpoints (`report-templates.*`, `reports/generate-data`).
- Project management (`projects.*`).

### Authentication
- **Mechanism**: Replit Auth via OpenID Connect (`openid-client` + Passport.js).
- **Session Management**: `express-session` with `connect-pg-simple` (PostgreSQL-backed).
- **Security**: Strong password policy, rate limiting on login, account lockout, session invalidation on password change, secure HTTP headers via Helmet middleware, HTTPOnly and secure cookies.
- **Authorization**: Role-based access control (e.g., "operator" role with restricted permissions).

### Database Migrations
- `drizzle-kit push` for schema synchronization.

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` (PostgreSQL connection string)
- `SESSION_SECRET` (for express-session)
- `ISSUER_URL` (OpenID Connect issuer URL, defaults to `https://replit.com/oidc`)
- `REPL_ID` (Replit environment identifier)

### Key NPM Packages
- **Frontend**: `react`, `wouter`, `@tanstack/react-query`, `react-hook-form`, `recharts`, `framer-motion`, `date-fns`, `zod`, `jsbarcode`, `shadcn/ui`, `tailwindcss`, `qrcode`.
- **Backend**: `express`, `passport`, `openid-client`, `express-session`, `drizzle-orm`, `pg`, `zod`, `helmet`, `express-rate-limit`, `bcryptjs`.