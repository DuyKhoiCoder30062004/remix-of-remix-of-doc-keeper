# Frontend-to-Spring Boot migration guide

This document explains how to keep the current frontend UI behavior while moving the data source from the in-memory mock layer to the real Spring Boot + PostgreSQL backend.

## Goal

The frontend should keep its current screens, routing, and UI logic. The only thing that should change is where data comes from:

- Today: mock data served through the axios mock adapter
- Later: real data served by Spring Boot APIs backed by PostgreSQL

## Current architecture

### Frontend
- React + TanStack Router
- React Query for async state
- Axios client in src/lib/api/client.ts
- UI pages in src/routes/*

### Current mock setup
- Mock data is centralized in src/lib/mock/seed-data.ts
- Mock API handlers are installed in src/lib/mock/install.ts
- The shared Axios client uses the mock adapter when VITE_USE_MOCK is enabled

## What is already prepared

The frontend is already structured so that:
- UI components do not depend on mock data directly
- route components call API modules like documentsApi, foldersApi, authApi, etc.
- the backend contract is expected to match the path structure under /api/v1

## How to switch from mock to Spring Boot

### 1. Disable the mock adapter
In the frontend environment file:
- set VITE_USE_MOCK=false

This makes the Axios client call the real Spring Boot backend instead of the mock adapter.

### 2. Ensure the backend contract matches the frontend
The frontend expects these base endpoints:
- /api/v1/auth/register
- /api/v1/auth/login
- /api/v1/auth/me
- /api/v1/documents
- /api/v1/documents/{id}
- /api/v1/folders
- /api/v1/users
- /api/v1/permissions
- /api/v1/sharing-requests

If Spring Boot exposes the same paths and returns the same JSON shapes, the UI should continue to work without major frontend changes.

### 3. Keep the current UI untouched
Do not rewrite the route components unless the backend contract changes.
The UI should continue to render based on the same data fields:
- documents
- folders
- users
- permissions
- audit logs

### 4. Let Spring Boot own persistence
The frontend should not contain business logic for storing or mutating records. It should only:
- request data
- display it
- send user actions back to the backend

The database and persistence logic belong in the Spring Boot service layer and PostgreSQL.

## Recommended implementation plan

### Step A: keep UI-only mode
- Leave the route pages and components as they are
- Keep the UI state and interaction behavior intact

### Step B: replace mock adapter with real backend calls
- Set VITE_USE_MOCK=false
- Point VITE_API_BASE_URL to the Spring Boot host, such as:
  - http://localhost:8080

### Step C: connect Spring Boot to PostgreSQL
In the Spring Boot application.properties file, configure:
- spring.datasource.url
- spring.datasource.username
- spring.datasource.password
- spring.datasource.driver-class-name
- spring.jpa.hibernate.ddl-auto
- spring.jpa.properties.hibernate.dialect

### Step D: implement backend entities and services
The Spring Boot backend should expose endpoints that return the same shapes expected by the frontend.

Suggested domain mapping:
- users -> user table
- folders -> folder table
- documents -> document table
- permissions -> permission table
- sharing_requests -> sharing request table
- audit_logs -> audit log table

### Step E: verify the UI works against real data
Test the following flows:
- login/register
- dashboard document list
- folder management
- document detail page
- admin user role update

## Important note about the current frontend

The frontend currently uses the mock adapter for development convenience. That is fine for UI prototyping, but the production-facing behavior should be:
- UI stays in React
- business data comes from Spring Boot
- persistence stays in PostgreSQL

## Safe rollback path

If you later want to return to the current mock-based version:
- set VITE_USE_MOCK=true again
- keep the mock seed data in src/lib/mock/seed-data.ts
- the frontend will continue to work with the same UI

## Suggested file structure for future cleanup

You may eventually want to separate the layers like this:
- src/lib/api/ -> transport layer
- src/lib/mock/ -> temporary demo layer
- src/routes/ -> UI layer

This keeps the UI independent from the data source.
