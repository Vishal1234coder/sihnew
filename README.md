# SIH 2024 - Smart Medicine Compliance System

A comprehensive healthcare management platform built for Smart India Hackathon 2024. Features role-based access for patients, doctors, hospital admins, and super admins with AI-powered assistance.

## Features

- **Role-Based Access**: Super Admin, Hospital Admin, Doctor, and Patient dashboards
- **AI Assistant**: Multilingual (English/Hindi) chatbot for medicine queries
- **Patient Compliance Tracking**: Monitor medication adherence
- **Doctor Dashboard**: Manage patients, create prescriptions
- **Hospital Management**: Oversee doctors and patient registrations
- **Real-time Notifications**: Alerts for missed medications

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Passport.js with express-session
- **AI**: OpenAI API integration
- **SMS**: Twilio integration

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

\`\`\`bash
npm install
cp .env.example .env  # Configure your environment variables
npm run dev
\`\`\`

### Environment Variables

| Variable | Description |
|----------|-------------|
| \`DATABASE_URL\` | PostgreSQL connection string |
| \`OPENAI_API_KEY\` | OpenAI API key for AI assistant |
| \`TWILIO_*\` | Twilio credentials for SMS |
| \`SESSION_SECRET\` | Express session secret |

## Project Structure

\`\`\`
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── lib/         # Utilities and API client
│   │   └── hooks/       # Custom React hooks
├── server/          # Express backend
│   ├── routes/      # API routes
│   ├── middleware/   # Auth and validation
│   └── db/          # Database schema and migrations
└── package.json
\`\`\`

## License

MIT