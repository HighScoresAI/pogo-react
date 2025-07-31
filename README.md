# Pogo React Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **Authentication System**: Login and registration with mock backend
- **Dashboard**: Overview of projects, sessions, and artifacts
- **Project Management**: View and manage projects
- **Session Management**: Track and manage sessions
- **Artifact Management**: Organize and view artifacts
- **User Profile**: Manage user settings and preferences
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Mock Authentication

Since this is a frontend-only application, it includes mock authentication:

### Pre-configured Users:
- **Email**: `demo@example.com` / **Password**: `password123`
- **Email**: `test@example.com` / **Password**: `test123`

### Register New Users:
You can also register new users through the signup form. New users will be stored in memory during the session.

## Application Structure

- **Dashboard** (`/dashboard`): Main overview with statistics and recent activity
- **Projects** (`/projects`): Manage and view projects
- **Sessions** (`/sessions`): Track recording sessions
- **Artifacts** (`/artifacts`): View captured artifacts
- **User Profile** (`/user-profile`): Manage user information
- **Preferences** (`/preferences`): Configure application settings

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: Material-UI (MUI) v7
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Authentication**: Mock JWT tokens
- **State Management**: React Context API

## Backend Integration

To connect to a real backend API:

1. Set the `NEXT_PUBLIC_API_URL` environment variable
2. Ensure your backend provides the following endpoints:
   - `POST /auth/login`
   - `POST /auth/signup`
   - `GET /projects`
   - `GET /sessions`
   - `GET /artifacts`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
