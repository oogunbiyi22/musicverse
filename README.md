# Musicverse – Supabase Music Sharing Platform

A full-featured music sharing platform built with Next.js 16, Supabase, and TypeScript.

## Features

- **Authentication**
  - Email/password signup and login
  - Google OAuth integration
  - Password reset flow
  - Auto-profile creation on signup via database trigger

- **Profile Management**
  - Editable profiles (username, full name, role, bio, avatar)
  - User logout
  - Health check endpoint to verify auth + profile setup

- **Music Sharing**
  - Upload audio files to Supabase Storage
  - Create posts with title, description, and audio
  - Public feed with audio playback
  - Posts display creator username and avatar

- **Security**
  - Row-Level Security (RLS) policies on profiles and posts
  - Public read for feed; owners can edit/delete their content
  - Safe API endpoints for config checks

## Tech Stack

- **Frontend**: Next.js 16 (Pages Router), React 19, TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Tailwind CSS + inline styles
- **Build**: Turbopack

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project with:
  - `profiles` table (id, username, full_name, bio, role, avatar_url, etc.)
  - `posts` table (id, title, content, user_id, audio_url, image_url, created_at, updated_at)
  - `user_uploads` storage bucket (public)

### Setup

1. **Clone and install**
   ```bash
   cd musicverse/musicverse
   npm install
   ```

2. **Configure environment**
   - Create `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

3. **Apply database migrations** (in Supabase SQL Editor)
   - Run `db/migrations/001_handle_new_user.sql` — auto-creates profile on signup
   - Run `db/migrations/002_rls_policies.sql` — enables RLS and sets policies

4. **Create storage bucket** (in Supabase Dashboard > Storage)
   - Name: `user_uploads`
   - Access: Public

5. **Run dev server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Key Routes

| Path                 | Purpose                                      |
|----------------------|----------------------------------------------|
| `/`                  | Home / Supabase config check                 |
| `/login`             | Email/password + Google OAuth login          |
| `/signup`            | Email/password signup                        |
| `/auth`              | Toggle login/signup (with OAuth)             |
| `/forgot-password`   | Request password reset email                 |
| `/reset-password`    | Update password (from email link)            |
| `/profile`           | Edit profile, logout, health check           |
| `/upload`            | Upload audio and create post                 |
| `/posts`             | Public feed with audio playback              |
| `/api/test`          | RLS-safe env check                           |
| `/api/health`        | Verify auth session + profile row            |

## Database Schema

**profiles**
- `id` (uuid, PK, references auth.users.id)
- `username`, `full_name`, `bio`, `role`, `avatar_url`, `website`

**posts**
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles.id)
- `title`, `content`, `audio_url`, `image_url`

**RLS**: Public read; owners can write/delete their own data.

## Migrations

1. **001_handle_new_user.sql** — auto-insert profile on signup
2. **002_rls_policies.sql** — enable RLS and create policies

Apply in Supabase SQL Editor in order.

## Troubleshooting

- **Route conflicts**: Pages Router only for auth/features
- **RLS errors**: Apply migration SQL
- **Storage 404s**: Ensure `user_uploads` bucket exists and is public
- **Build errors**: Run `npm run build` to catch type errors

## License

MIT

