# Project Workflow Guide

This document explains how this project works, how the files connect, and what happens from startup to each major feature.

## 1. What this app is

This is a document management web app built with:
- React + TypeScript
- TanStack Router for page routing
- TanStack Query for data fetching and caching
- Tailwind CSS for styling
- Axios for API calls

The app is designed to look like a secure document vault with:
- authentication
- document listing/search
- upload workflow
- folder management
- document detail view
- sharing and permissions
- admin user controls

---

## 2. How the app starts

### Main entry points

1. Package scripts are defined in package.json.
   - `pnpm dev` starts the development server.
   - `pnpm build` builds the app for production.

2. The Vite dev server starts the app.

3. The app bootstraps through:
   - src/start.ts
   - src/server.ts
   - src/router.tsx

### Startup flow

- src/start.ts creates the TanStack start instance and error middleware.
- src/server.ts handles server-side entry logic and error rendering.
- src/router.tsx creates the router and attaches the query client.

This means the app is not just a simple React app; it uses a router-based app shell with server-side support.

---

## 3. Folder structure and purpose

### Root files

- package.json
  - Lists dependencies and scripts.

- tsconfig.json
  - TypeScript configuration.

- vite.config.ts
  - Vite configuration.

- bunfig.toml
  - Bun-related config.

- pnpm-lock.yaml
  - Package lock file for pnpm.

### src/

#### src/routes/
This folder contains all page routes.

- src/routes/__root.tsx
  - Root layout for the app.
  - Wraps the app in QueryClientProvider.
  - Defines the global page shell, metadata, and error/404 UI.

- src/routes/index.tsx
  - Dashboard page.
  - Shows recent documents and lets the user search documents.

- src/routes/auth.tsx
  - Login/register page.
  - Handles user authentication UI.

- src/routes/documents.$id.tsx
  - Document detail page.
  - Displays the selected document, permissions, sharing requests, and audit logs.

- src/routes/folders.tsx
  - Folder management page.
  - Creates, renames, deletes folders, and moves documents.

- src/routes/upload.tsx
  - Upload page.
  - Lets the user select files and upload them.

- src/routes/admin.tsx
  - Admin page.
  - Lets admins manage user roles and export logs.

#### src/components/
This folder contains reusable UI pieces.

- src/components/app-shell.tsx
  - Shared layout used across pages.
  - Contains sidebar navigation, top header, search bar, and primary action button.

#### src/hooks/
- src/hooks/use-auth.ts
  - Central auth hook.
  - Stores the current user and provides login/logout/register helpers.

#### src/lib/
This folder contains app logic and shared API helpers.

- src/lib/api/
  - Holds the API layer for all backend communication.

  - src/lib/api/client.ts
    - Main Axios instance.
    - Sets the base URL.
    - Adds auth token to requests.
    - Handles API errors.

  - src/lib/api/auth.ts
    - Auth-related API calls: login, register, logout, me.

  - src/lib/api/documents.ts
    - Document API calls: list, get, upload, rename, move, delete, download, audit log.

  - src/lib/api/folders.ts
    - Folder API calls.

  - src/lib/api/permissions.ts
    - Permission management.

  - src/lib/api/sharing.ts
    - Sharing request flow.

  - src/lib/api/users.ts
    - Admin user management.

  - src/lib/api/types.ts
    - Shared TypeScript interfaces for data models.

- src/lib/mock/
  - Contains mock backend logic for development.
  - src/lib/mock/db.ts stores mock data.
  - src/lib/mock/install.ts installs mock API routes in the browser.

- src/lib/error-capture.ts
- src/lib/error-page.ts
- src/lib/lovable-error-reporting.ts
  - Error handling helpers.

#### src/styles.css
- Global styling and Tailwind theme setup.
- Defines the design system variables for colors, radius, and dark mode.

---

## 4. Main workflow of the app

### A. User opens the app

- The root route loads.
- The app shell is shown.
- The router decides which page to render based on the URL.

### B. Authentication flow

1. The user visits /auth.
2. The Auth page shows sign-in or create-account form.
3. The form calls useAuth login/register.
4. The auth API sends a request to the backend.
5. On success:
   - a token is stored in localStorage
   - the current user is set in memory
   - the app redirects to the dashboard

### C. Dashboard workflow

1. The dashboard page loads.
2. It calls documentsApi.list() to fetch documents.
3. A search input filters the list locally with debounce.
4. Each document row shows:
   - title
   - extension/type
   - size
   - owner
   - updated date
5. Deleting a document triggers a mutation and refreshes the document list.

### D. Upload workflow

1. The user opens /upload.
2. They select one or more files.
3. The upload page creates an upload mutation.
4. The selected file is sent using documentsApi.upload().
5. When complete:
   - the document is added to the mock/real data store
   - the document list is invalidated/refreshed

### E. Folder workflow

1. The folders page loads all folders and documents.
2. The user can create a new folder.
3. The user can rename or delete folders.
4. The user can move documents between folders.
5. The selected folder changes which documents are shown.

### F. Document detail workflow

1. The detail page fetches the selected document by id.
2. It also loads:
   - permissions
   - sharing requests
   - audit log
3. The user can:
   - download the document
   - rename it
   - delete it
   - change permissions
   - approve/deny sharing requests

### G. Admin workflow

1. Only admins can access /admin.
2. The admin page fetches all users.
3. Admins can change roles for users.
4. Admins can export an audit log CSV.

---

## 5. How data flows in this app

### Frontend to API layer

- Pages call API helpers from src/lib/api/.
- These API helpers use the shared Axios client.
- The client adds the bearer token and sends requests to /api/v1.

### Mock mode vs real backend

By default, the app uses mock APIs.

The setup is controlled in:
- src/lib/api/client.ts

Important flags:
- `VITE_USE_MOCK` controls whether the mock adapter is installed.
- `VITE_API_BASE_URL` controls the backend base URL.

If mock mode is enabled, the app behaves as if a real backend exists, but data is stored in memory.

---

## 6. Important frontend patterns

### React Query

The app uses TanStack Query for:
- fetching data
- caching
- invalidating queries after mutations

Example:
- after uploading a file, the app invalidates the documents query so the list refreshes.

### Route-based structure

Each page is a route file under src/routes.
That keeps the app modular.

### Shared UI shell

The AppShell component provides the common layout for most pages.
That means each route gets the same sidebar, header, and search UX.

---

## 7. How to run locally

From the project root:

```bash
pnpm install
pnpm dev
```

Then open the local Vite URL shown in the terminal.

---

## 8. Quick mental model

Think of the project like this:

- routes = pages
- components = reusable UI blocks
- hooks = shared stateful logic
- lib/api = backend communication
- lib/mock = fake backend for demos/testing

So if you want to change a feature, you usually start in the matching route file and then check the API layer if the data needs to come from a backend.

---

## 9. Recommended places to start when editing

- Want to change the layout? -> src/components/app-shell.tsx
- Want to change login/auth behavior? -> src/routes/auth.tsx and src/hooks/use-auth.ts
- Want to change document list behavior? -> src/routes/index.tsx
- Want to change upload behavior? -> src/routes/upload.tsx
- Want to change folder behavior? -> src/routes/folders.tsx
- Want to change permissions/sharing? -> src/routes/documents.$id.tsx
- Want to change admin actions? -> src/routes/admin.tsx
- Want to change the backend connection? -> src/lib/api/client.ts
