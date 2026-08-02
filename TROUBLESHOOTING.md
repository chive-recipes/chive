# Vite Development Troubleshooting & Quick-Fix Guide

If the local dev server (`npm run dev`) hangs, takes several minutes to start, or ignores `Ctrl+C` inputs, use this guide to identify and resolve the issue quickly.

---

## 1. Quick-Fix Commands

Run this one-liner in your terminal to instantly kill hanging processes, clear caches, and perform a fresh restart:

```bash
# 1. Kill any zombie Node/Vite processes
pkill -f vite || killall node

# 2. Clear Vite dependency optimizer cache
rm -rf node_modules/.vite

# 3. Restart the dev server cleanly
npm run dev
```

---

## 2. Diagnosing Common Issues

### A. The Dependency Optimization Loop (Waterfalls)
* **Symptoms**: The browser loading spinner spins indefinitely, the page is blank, and CPU usage spikes. Looking at the browser's **Network** or **Console** tab reveals dozens of parallel requests and `504 (Outdated Optimize Dep)` errors.
* **Root Cause**: When a module inside `node_modules` is imported directly (e.g. `import Zap from 'lucide-preact/dist/esm/icons/zap.js'`), Vite treats each sub-path as an individual dependency. If there are dozens of such files (like icons), Vite is forced to run dynamic dependency pre-bundling on-the-fly for *each* file. This triggers a reload loop that blocks the event loop and locks the process.
* **Fix**: Ensure that libraries with multiple icons or components (like `lucide-preact`) are imported from their main entry points in development:
  ```typescript
  // Good (Development): Vite pre-bundles this once as a single module
  import { Zap, Compass, Info } from 'lucide-preact';
  ```
  Keep any custom import-rewriter plugins configured to run **only** during production builds (`command === 'build'`).

### B. Zombie Processes Holding Ports
* **Symptoms**: Vite starts on port `5174` instead of `5173`, or Vite reports `port 5173 in use`, or the dev server does not respond at all.
* **Root Cause**: A previous Vite process was not terminated cleanly and is still running in the background.
* **Fix**: Locate and terminate the process using the port:
  ```bash
  # Find the PID using port 5173
  lsof -i :5173
  
  # Force kill the process by PID (replace <PID> with the actual number)
  kill -9 <PID>
  ```

### C. Corruption in `node_modules`
* **Symptoms**: Unexpected runtime syntax errors or compilation errors originating from internal files of `vite` or other package dependencies.
* **Fix**: Force a clean dependency re-extraction:
  ```bash
  # Delete and reinstall Vite cleanly
  rm -rf node_modules/vite node_modules/.vite && npm install
  ```
