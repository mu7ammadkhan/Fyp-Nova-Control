# Application routing

The app uses the installed React Router with nested route objects and `Outlet` layouts. The route hierarchy lives in `src/routes/routeTree.js`; URL builders live in `src/routes/paths.js`.

```text
RootLayout
├── /                         session-aware redirect
├── GuestRoute
│   └── /login
├── ProtectedRoute
│   ├── /dashboard            AppLayout (persistent navigation)
│   │   ├── index             Dashboard
│   │   ├── rooms             RoomsLayout
│   │   │   ├── index         Rooms
│   │   │   └── :roomId       Room devices
│   │   ├── devices           All devices
│   │   ├── profile           Profile
│   │   └── *                 Workspace 404
│   └── legacy URL redirects
└── *                         Public 404
```

## Session and navigation behavior

- Protected routes wait for Firebase Auth restoration before deciding whether to redirect.
- Guests are sent to `/login` with the intended pathname, query and fragment in router state. After sign-in they return to a recognized internal workspace route.
- Existing `/room`, `/room/:roomId`, `/rooms`, `/rooms/:roomId`, `/devices` and `/profile` links use replacement redirects, preserving queries and fragments.
- Workspace navigation remains mounted while lazy child pages load. Existing shared Firebase listeners survive page changes.
- Unknown URLs display a 404. Rendering or lazy-module failures display recovery actions.
- Desktop and mobile links use the canonical paths; Dashboard is active only at its index, and Rooms remains active inside a room.
- Page titles follow route metadata. Forward navigation resets page scroll; browser back/forward and fragment links retain their normal behavior.

## Hosting

Vite development and preview servers already serve nested paths. A production static host must serve `index.html` for application paths such as `/dashboard/rooms/abc`. Configure an SPA history fallback on the chosen host, preserving normal asset/API handling. Client routing does not replace Firebase authorization rules.

## Verification

`npm test` checks the actual route hierarchy, legacy redirects, active sections and safe return destinations. `npm run lint`, `npm run build` and `npm run check:bundle` verify the source and keep the login bundle independent of protected workspace modules.
