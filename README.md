# Locate-IQ

A responsive internal web app for browsing hardware devices like gateways and anchors.

## Features

- Catalog view with search and filters
- Device detail pages
- Built with React, TypeScript, and Tailwind CSS
- Backend integration with NocoDB

## Getting Started

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

- `src/components/` - React components
- `src/data/` - Mock data and types
- `src/` - Main app files

## Backend

This app is designed to work with NocoDB as the backend for structured data.

## Database Workflow

- Backups: `npm run db:backup`
- Migration status: `npm run db:migrations`
- Apply migrations: `npm run db:migrations:apply`
- Safe apply with backup first: `npm run db:migrations:apply:safe`

Reference docs:

- [`docs/nocodb-migrations.md`](/c:/Users/Anshaj/Desktop/Locate-IQ/docs/nocodb-migrations.md)
- [`docs/nocodb-linked-record-migration-plan.md`](/c:/Users/Anshaj/Desktop/Locate-IQ/docs/nocodb-linked-record-migration-plan.md)

## Product PDFs

The project now includes a UI-facing document library at [`public/docs/README.md`](/c:/Users/Anshaj/Desktop/Locate-IQ/public/docs/README.md).

Use this for product PDFs you want to open directly from the frontend with paths like `/docs/gateways/...` or `/docs/anchors/...`.
