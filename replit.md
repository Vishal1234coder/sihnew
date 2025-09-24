# MediCare Plus - Smart Medicine Reminder & Compliance System

## Overview

MediCare Plus is a comprehensive healthcare management system that provides smart medicine reminder and compliance tracking capabilities. The application serves multiple user roles including super admins, hospital administrators, doctors, and patients. It features AI-powered patient assistance, automated medication reminders via SMS, and detailed compliance analytics to improve medication adherence rates across healthcare institutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand with persistence for authentication state
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Data Fetching**: TanStack Query for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Simple token-based authentication (simplified for demo)
- **File Structure**: Monorepo structure with shared schema and types

### Role-Based Access Control
The system implements a four-tier role hierarchy:
- **Super Admin**: Full system access, manages hospitals and users
- **Hospital Admin**: Manages doctors and patients within their hospital
- **Doctor**: Creates prescriptions, monitors patient compliance, accesses AI insights
- **Patient**: Views medications, updates status, interacts with AI assistant

### Database Design
- **PostgreSQL**: Primary database with UUID primary keys
- **Schema Management**: Drizzle migrations for version control
- **Data Models**: Users, Hospitals, Doctors, Patients, Medicines, Prescriptions, Medicine Status, Reminders, AI Conversations, Compliance Stats
- **Relationships**: Proper foreign key constraints and cascading relationships

### AI Integration
- **Provider**: OpenAI GPT integration for patient assistance
- **Multilingual Support**: English and Hindi language support
- **Context Awareness**: Patient-specific context including medicines and medical history
- **Conversation Tracking**: Persistent chat history with categorization

### SMS Notification System
- **Provider**: Twilio for SMS delivery
- **Reminder Types**: Regular medication reminders and urgent alerts
- **Scheduling**: Time-based reminder system
- **Fallback**: Mock implementation when Twilio credentials unavailable

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting (`@neondatabase/serverless`)
- **OpenAI**: AI assistant capabilities for patient support
- **Twilio**: SMS and voice call notifications for medication reminders

### Core Dependencies
- **Database**: Drizzle ORM (`drizzle-orm`, `drizzle-zod`) with PostgreSQL
- **Authentication**: Session management with `connect-pg-simple`
- **UI Components**: Radix UI primitives for accessible component foundation
- **State Management**: Zustand for client state, TanStack Query for server state
- **Form Handling**: React Hook Form with Hookform Resolvers
- **Date Utilities**: date-fns for date manipulation
- **Styling**: Tailwind CSS with class-variance-authority for component variants

### Development Tools
- **Build Tools**: Vite for frontend, ESBuild for backend bundling
- **Type Safety**: TypeScript throughout the stack
- **Database Migrations**: Drizzle Kit for schema management
- **Development Server**: Custom Vite middleware for full-stack development