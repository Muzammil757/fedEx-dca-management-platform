# Backend Setup Guide

This guide will help you set up the Supabase backend for the RecoverIQ application.

## Prerequisites

1. Node.js 18+ installed
2. A Supabase account (free tier works)

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization and fill in:
   - **Project name**: RecoverIQ (or any name)
   - **Database Password**: Generate or create a strong password (save this!)
   - **Region**: Choose closest to your location
4. Click "Create new project" and wait for it to provision (~2 minutes)

## Step 2: Get Your Connection Details

Once your project is ready:

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

3. Go to **Settings** → **Database**
4. Copy the **Connection string** (URI format)
   - Replace `[YOUR-PASSWORD]` with your database password

## Step 3: Create Environment File

Create a `.env.local` file in the `ddc` folder with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Connection
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Auth Configuration
AUTH_SESSION_SECRET=your-random-32-char-secret-here
```

Generate a random secret for AUTH_SESSION_SECRET (e.g., run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

## Step 4: Create Database Tables

### Option A: Run SQL in Supabase Dashboard

1. Go to **SQL Editor** in Supabase dashboard
2. Open the file `database/schema.sql` from this project
3. Copy and paste the entire contents into the SQL editor
4. Click "Run"

### Option B: Use Drizzle Push (Recommended)

Run the following commands in the `ddc` folder:

```bash
npm run db:push
```

This will automatically create all tables based on the Drizzle schema.

## Step 5: Seed Initial Users

Run the seed script to create the initial admin and DCA users:

```bash
npm run db:seed
```

This creates:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | Admin@123 |
| DCA Agent | dca@partner.com | Dca@123 |

## Step 6: Start the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with one of the seeded accounts.

## Troubleshooting

### "Invalid credentials" error
- Make sure you ran `npm run db:seed`
- Check that your `.env.local` has the correct DATABASE_URL

### "Connection refused" error
- Verify your DATABASE_URL is correct
- Check if your IP is allowed (Supabase Settings → Database → Connection Info)

### Tables not found
- Run `npm run db:push` to create tables
- Or run the SQL from `database/schema.sql` manually

## Database Schema Overview

| Table | Description |
|-------|-------------|
| `users` | Admin and DCA user accounts |
| `auth_sessions` | Login sessions |
| `customers` | Debtor information |
| `dca_agencies` | Collection agency profiles |
| `cases` | Recovery cases linking customers to DCAs |
| `dca_performance_metrics` | Monthly DCA statistics |
| `case_notes` | Notes and communications on cases |
| `activity_logs` | Audit trail of all actions |
| `sla_alerts` | SLA deadline notifications |
| `payment_records` | Payment history |
| `completed_cases_archive` | Archived resolved cases |

## API Routes

| Endpoint | Methods | Description | Access |
|----------|---------|-------------|--------|
| `/api/auth/login` | POST | User login | Public |
| `/api/auth/logout` | POST | User logout | Auth |
| `/api/auth/me` | GET | Current user | Auth |
| `/api/customers` | GET, POST | Customer management | Admin |
| `/api/customers/[id]` | GET, PATCH, DELETE | Single customer | Admin |
| `/api/cases` | GET, POST | Case management | Auth |
| `/api/cases/[id]` | GET, PATCH, DELETE | Single case | Auth |
| `/api/dca-agencies` | GET, POST | Agency management | Admin |
| `/api/dca-agencies/[id]` | GET, PATCH, DELETE | Single agency | Admin |
| `/api/activity-logs` | GET | Audit logs | Admin |
| `/api/dashboard` | GET | Dashboard stats | Auth |

## Next Steps

After setup is complete:

1. Log in as admin to configure agencies and customers
2. Create cases and assign them to DCA agencies
3. Log in as DCA to view assigned cases
4. All changes are tracked in the activity logs
