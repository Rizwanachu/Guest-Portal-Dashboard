/**
 * Vercel serverless function entry point.
 * Exports the Express app so Vercel can invoke it as a serverless handler.
 * All routes are registered under /api in app.ts, matching the /api/(.*) rewrite in vercel.json.
 */
import app from "../artifacts/api-server/src/app";

export default app;
