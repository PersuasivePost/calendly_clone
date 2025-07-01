# Calendly Clone

Build and Deploy a modern, full-stack Calendly clone with Google Calendar integration—manage timezones, events, and meeting links like a pro using Next.js 15, Typescript, React 19, Tailwind CSS v4, Neon, Drizzle, Clerk and much more.

## Features

- 🔒 Authentication with Clerk
- 📅 Google Calendar integration
- 🌍 Timezone management
- 🗓️ Create, edit, and share events
- 🕒 Book meetings with real-time availability
- 🖥️ Modern UI with Tailwind CSS v4
- 🗄️ Database: Neon (Postgres) + Drizzle ORM
- ⚡ Full-stack with Next.js 15 (App Router)
- 🧑‍💻 TypeScript & React 19
- 🧩 Modular, scalable codebase

## Tech Stack

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Neon](https://neon.tech/) (Postgres)
- [Clerk](https://clerk.com/) (Auth)
- [Google Calendar API](https://developers.google.com/calendar)
- [shadcn/ui](https://ui.shadcn.com/) (UI components)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/calendly-clone.git
cd calendly_clone
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Set up environment variables

Create a `.env` file in the root directory and add:

```
DATABASE_URL=your_neon_postgres_url
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_google_redirect_uri
```

### 4. Database setup (Drizzle + Neon)

- Generate migrations:
  ```bash
  yarn db:generate
  ```
- Apply migrations:
  ```bash
  yarn db:migrate
  ```

### 5. Run the development server

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

## Google Calendar Integration

- Make sure your Google Cloud project is set up and OAuth credentials are configured.
- Add your Google OAuth credentials to the `.env` file.
- Only approved test users can use Google login until your app is verified by Google.

## Folder Structure

```
app/                # Next.js app directory
components/         # Reusable React components
constants/          # App-wide constants
server/             # Server actions and API integrations
lib/                # Utility functions
public/             # Static assets
schema/             # Zod schemas
```

## Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn db:generate` - Generate Drizzle migrations
- `yarn db:migrate` - Apply Drizzle migrations

## Deployment

- Deploy on [Vercel](https://vercel.com/) or your preferred platform.
- Set all environment variables in your deployment dashboard.

```sql
PersuasivePost
```
