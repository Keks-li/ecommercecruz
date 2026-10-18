/**
 * Cruzaro Render Keep-Alive Script
 * 
 * Prevents Render.com free tier web services from spinning down (sleeping)
 * after 15 minutes of inactivity by pinging the /api/health endpoint every 13 minutes.
 * 
 * Usage:
 *   node scripts/keep_alive.js [RENDER_BACKEND_URL]
 * 
 * Examples:
 *   node scripts/keep_alive.js https://cruzaro-backend.onrender.com
 *   RENDER_BACKEND_URL=https://cruzaro-backend.onrender.com node scripts/keep_alive.js
 */

const INTERVAL_MINUTES = 13;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;
const TIMEOUT_MS = 90000; // 90s timeout (allows waking up from cold start if already asleep)

// Read target URL from CLI arg, environment variable, or fallback
const rawUrl = process.argv[2] || process.env.RENDER_BACKEND_URL || process.env.BACKEND_URL || 'https://cruzaro-backend.onrender.com';
const baseUrl = rawUrl.replace(/\/+$/, '');
const targetUrl = baseUrl.endsWith('/api/health') ? baseUrl : `${baseUrl}/api/health`;

function getTimestamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function getNextTimeString(msFromNow) {
  return new Date(Date.now() + msFromNow).toLocaleTimeString('en-GB', { hour12: false });
}

async function pingBackend() {
  const startTime = Date.now();
  console.log(`[${getTimestamp()}] 📡 Pinging ${targetUrl} ...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Cruzaro-Render-KeepAlive/1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (response.ok) {
      let statusText = '';
      try {
        const body = await response.json();
        statusText = body.status ? ` - status: "${body.status}"` : '';
      } catch {
        statusText = '';
      }
      console.log(`[${getTimestamp()}] ✅ Response: ${response.status} ${response.statusText} (${latency}ms)${statusText}`);
    } else {
      console.warn(`[${getTimestamp()}] ⚠️ Server responded with HTTP ${response.status} (${latency}ms)`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;
    if (err.name === 'AbortError') {
      console.error(`[${getTimestamp()}] ❌ Ping timed out after ${TIMEOUT_MS / 1000}s (Backend might be in deep cold start).`);
    } else {
      console.error(`[${getTimestamp()}] ❌ Ping failed (${latency}ms): ${err.message}`);
    }
  }

  console.log(`[${getTimestamp()}] ⏳ Next ping scheduled in ${INTERVAL_MINUTES} minutes (at ${getNextTimeString(INTERVAL_MS)})\n`);
}

// Banner
console.log('===========================================================');
console.log('🚀 CRUZARO RENDER BACKEND KEEP-ALIVE DAEMON');
console.log(`🎯 Target Endpoint: ${targetUrl}`);
console.log(`⏱️  Ping Interval:   Every ${INTERVAL_MINUTES} minutes`);
console.log(`🛡️  Mode:            Active (keeps Render free tier awake)`);
console.log('===========================================================\n');

// Initial immediate ping
pingBackend();

// Recurring timer every 13 minutes
setInterval(pingBackend, INTERVAL_MS);
