/**
 * Simple Hyperliquid connectivity bot (Node.js).
 * Verifies connectivity to the Hyperliquid API and prints state/price snapshots.
 *
 * Usage:
 *   HYPERLIQUID_API=https://api.hyperliquid.xyz \
 *   HYPERLIQUID_WALLET=0xYourWallet \
 *   node scripts/hyperliquid-bot.js
 *
 * Notes:
 * - This script is read-only by default (fetches info endpoints).
 * - To send orders you must proxy/sign requests yourself; integrate in the
 *   `placeExampleOrder` stub with your signing logic or backend.
 */

const API_BASE = process.env.HYPERLIQUID_API || 'https://api.hyperliquid.xyz';
const WALLET = process.env.HYPERLIQUID_WALLET || null;

const headers = { 'Content-Type': 'application/json' };

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getClearinghouseState() {
  return post('/info', { type: 'clearinghouseState', wallet: WALLET });
}

async function getMeta() {
  return post('/info', { type: 'meta' });
}

async function placeExampleOrder() {
  // Hyperliquid requires signing; this is intentionally left as a stub.
  // Wire your signing/proxy layer here and send the resulting payload
  // to `${API_BASE}/exchange`.
  console.log('[bot] placeExampleOrder stub: add signing + proxy before live trading.');
}

async function main() {
  console.log(`[bot] Hyperliquid connectivity check → ${API_BASE}`);
  if (WALLET) console.log(`[bot] Wallet: ${WALLET}`);
  try {
    const meta = await getMeta();
    console.log(`[bot] Meta loaded: ${meta?.universe?.length || 0} markets`);

    const state = await getClearinghouseState();
    const positions = state?.assetPositions || [];
    console.log(`[bot] Positions: ${positions.length}`);
    if (positions.length) {
      positions.slice(0, 3).forEach((p, i) => {
        console.log(
          `  #${i + 1} ${p.position.coin} sz=${p.position.szi} pnl=${p.position.unrealizedPnl}`
        );
      });
    }
  } catch (err) {
    console.error('[bot] Error:', err.message);
  }
}

main();
