# Supabase Setup Guide

This document explains how to set up, migrate, and deploy the Supabase backend architecture for Kakinada Fresh.

## Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Install [Supabase CLI](https://supabase.com/docs/guides/cli)

## 1. Local Development Setup

1. **Initialize Supabase** (if not already done):
   ```bash
   supabase init
   ```

2. **Start the local Supabase environment**:
   ```bash
   supabase start
   ```
   *This will spin up the database, API, Studio, and Storage locally. It will output your local API keys which you should copy into `.env.local`.*

3. **Apply Migrations**:
   The migration files in `supabase/migrations/` will automatically run when you start Supabase. If you need to reset the database and re-apply migrations:
   ```bash
   supabase db reset
   ```

## 2. Deploying to Production

When you are ready to deploy your database schema to your hosted Supabase project:

1. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

2. **Push Migrations**:
   ```bash
   supabase db push
   ```

## 3. Deploying Edge Functions

The architecture includes several Edge Functions in `supabase/functions/` (e.g., `push-notifications`).

To deploy an Edge Function:
```bash
supabase functions deploy push-notifications --project-ref your-project-ref
```

To run an Edge Function locally:
```bash
supabase functions serve push-notifications
```

## 4. Realtime Configuration

By default, we have set up the schema. To enable Realtime broadcasting for your apps, you need to explicitly enable the tables in your Supabase Dashboard or by running a SQL command:

```sql
-- Run this in your Supabase SQL editor to enable realtime on key tables
begin; 
  drop publication if exists supabase_realtime; 
  create publication supabase_realtime; 
commit;
alter publication supabase_realtime add table products, orders, categories, homepage_sections, homepage_banners, coupons, notifications, business_settings;
```

## 5. Next Steps
- Implement the client-side integration in the Next.js and Flutter apps.
- Connect your Push Notification provider (like Firebase) to the Edge Functions.
