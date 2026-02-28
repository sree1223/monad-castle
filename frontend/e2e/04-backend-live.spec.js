/**
 * 04-backend-live.spec.js
 *
 * Direct API integration tests via Playwright's request API fixture.
 * Hits the running Express backend at http://localhost:3001.
 *
 * Prerequisites (must be running before executing this test file):
 *   cd vercelback && node src/index.js
 *
 * Covers all 13 routes + Pinata upload stub:
 *   GET  /api              — health check
 *   GET  /api/castles      — castle rounds
 *   POST /api/events       — insert attack event
 *   GET  /api/events       — list recent events
 *   GET  /api/events/:actor— events by wallet
 *   GET  /api/leaderboard  — top players
 *   GET  /api/player/:addr — player stats
 *   POST /api/player       — upsert player
 *   POST /api/rounds       — record round
 *   GET  /api/rounds/:id   — round history
 *   GET  /api/gallery      — get all pixels
 *   GET  /api/gallery/:r/:c— get single pixel
 *   POST /api/gallery      — paint a pixel
 *   GET  /api/xxx          — 404 for unknown routes
 *
 * Uses unique test addresses/data that won't collide with real game data.
 * Vitest api.test.js handles deep cleanup; here we just verify shape.
 */

import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3001'

// ── Unique test identifiers ───────────────────────────────────────────────────
// Pattern: e2e1 repeated — guaranteed not a real user wallet
const T_ADDR  = ('0x' + 'e2e1'.repeat(10)).slice(0, 42)   // 0xe2e1e2e1e2e1e2e1e2e1
const T_ADDR2 = ('0x' + 'e2e2'.repeat(10)).slice(0, 42)   // 0xe2e2e2e2e2e2e2e2e2e2
const T_TX    = ('0x' + 'dead'.repeat(16)).slice(0, 66)   // 0xdeaddeaddeaddead...
let  _insertedEventId = null

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────
test.describe('GET /api — Health Check', () => {

  test('returns 200 with ok=true, db=ok, service and version', async ({ request }) => {
    const res  = await request.get(`${BASE}/api`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.db).toBe('ok')
    expect(body.service).toBe('moncastle-api')
    expect(body.version).toBe('3.0')
  })

  test('response includes env field (string)', async ({ request }) => {
    const res  = await request.get(`${BASE}/api`)
    const body = await res.json()
    expect(typeof body.env).toBe('string')
  })

  test('CORS Access-Control-Allow-Origin header is present', async ({ request }) => {
    const res = await request.get(`${BASE}/api`)
    expect(res.headers()['access-control-allow-origin']).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. PLAYER ROUTES
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Player API', () => {

  test('POST /api/player — creates / upserts player', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/player`, {
      data: { address: T_ADDR, wins_delta: 1, earned_delta: 100, attack_delta: 5 },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  test('GET /api/player/:address — returns player with required fields', async ({ request }) => {
    await request.post(`${BASE}/api/player`, {
      data: { address: T_ADDR, attack_delta: 0 },
    })
    const res  = await request.get(`${BASE}/api/player/${T_ADDR}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.address).toBe(T_ADDR)
    expect(typeof body.wins).toBe('number')
    expect(typeof body.attack_count).toBe('number')
  })

  test('POST /api/player — upsert accumulates deltas', async ({ request }) => {
    await request.post(`${BASE}/api/player`, { data: { address: T_ADDR2, wins_delta: 2, attack_delta: 10 } })
    await request.post(`${BASE}/api/player`, { data: { address: T_ADDR2, wins_delta: 1, attack_delta: 5  } })
    const res  = await request.get(`${BASE}/api/player/${T_ADDR2}`)
    const body = await res.json()
    expect(body.wins).toBeGreaterThanOrEqual(3)
    expect(body.attack_count).toBeGreaterThanOrEqual(15)
  })

  test('GET /api/player/:address — unknown wallet returns zeros', async ({ request }) => {
    const unknown = ('0x' + 'c0ffee'.padEnd(40, '0')).slice(0, 42)
    const res  = await request.get(`${BASE}/api/player/${unknown}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.wins).toBe(0)
    expect(body.attack_count).toBe(0)
  })

  test('GET /api/player/:address — 400 on non-hex address', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/player/not-an-address`)
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/[Ii]nvalid/)
  })

  test('POST /api/player — 400 when address missing', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/player`, { data: { wins_delta: 1 } })
    expect(res.status()).toBe(400)
  })

  test('POST /api/player — 400 when address format is invalid', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/player`, {
      data: { address: 'not-valid', wins_delta: 1 },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/[Ii]nvalid/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. EVENTS ROUTES
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Events API', () => {

  test('POST /api/events — inserts an attack event', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/events`, {
      data: { type: 'attack', castle_id: 0, actor: T_ADDR, tx_hash: T_TX, value_mon: '0.01' },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(typeof body.id).toBe('number')
    _insertedEventId = body.id
  })

  test('GET /api/events — returns array of recent events', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/events`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /api/events — respects ?limit query param', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/events?limit=3`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.length).toBeLessThanOrEqual(3)
  })

  test('GET /api/events/:actor — returns events for the test address', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/events/${T_ADDR}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /api/events/:actor — 400 on invalid address', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/events/bad-address`)
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/[Ii]nvalid/)
  })

  test('POST /api/events — 400 when required fields missing', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/events`, { data: { type: 'attack' } })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  test('GET /api/events — uses since query param correctly', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/events?since=0&limit=10`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. CASTLES
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Castles API', () => {

  test('GET /api/castles — returns array', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/castles`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Leaderboard API', () => {

  test('GET /api/leaderboard — returns array with limit ≤ 10', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/leaderboard`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeLessThanOrEqual(10)
  })

  test('GET /api/leaderboard?limit=3 — returns ≤ 3 entries', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/leaderboard?limit=3`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.length).toBeLessThanOrEqual(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. ROUNDS
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Rounds API', () => {

  test('POST /api/rounds — records a completed round', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/rounds`, {
      data: {
        castle_id: 0, round_id: 9999, winner: T_ADDR,
        payout_mon: '0.18', tx_hash: T_TX,
      },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(typeof body.id).toBe('number')
  })

  test('GET /api/rounds/:castleId — returns array for castle 0', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/rounds/0`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /api/rounds/:castleId — 400 on castleId > 9', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/rounds/99`)
    expect(res.status()).toBe(400)
  })

  test('POST /api/rounds — 400 when winner missing', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/rounds`, { data: { castle_id: 0 } })
    expect(res.status()).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. GALLERY
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Gallery API', () => {

  test('GET /api/gallery — returns array (may be empty)', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/gallery`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('POST /api/gallery — paints a pixel at (5,5)', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/gallery`, {
      data: { row: 5, col: 5, painter: T_ADDR, r: 255, g: 128, b: 0 },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  test('GET /api/gallery/5/5 — returns the pixel we just painted', async ({ request }) => {
    // Ensure pixel exists
    await request.post(`${BASE}/api/gallery`, {
      data: { row: 5, col: 5, painter: T_ADDR, r: 200, g: 100, b: 50 },
    })
    const res  = await request.get(`${BASE}/api/gallery/5/5`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.row).toBe(5)
    expect(body.col).toBe(5)
    expect(typeof body.r).toBe('number')
    expect(typeof body.g).toBe('number')
    expect(typeof body.b).toBe('number')
  })

  test('POST /api/gallery — 400 when painter missing', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/gallery`, {
      data: { row: 0, col: 0, r: 0, g: 0, b: 0 },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/gallery — 400 when row > 29', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/gallery`, {
      data: { row: 30, col: 0, painter: T_ADDR, r: 0, g: 0, b: 0 },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('0–29')
  })

  test('GET /api/gallery/:row/:col — 400 when row out of range', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/gallery/99/1`)
    expect(res.status()).toBe(400)
  })

  test('GET /api/gallery/0/0 — 404 if pixel not painted', async ({ request }) => {
    // row 0, col 0 is unlikely to be painted in test DB, but may be 200 if it is
    const res  = await request.get(`${BASE}/api/gallery/0/0`)
    expect([200, 404]).toContain(res.status())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. GALLERY UPLOAD (Pinata)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Gallery Upload (Pinata)', () => {

  test('POST /api/gallery/upload — 400 when imageBase64 missing', async ({ request }) => {
    const res  = await request.post(`${BASE}/api/gallery/upload`, {
      data: { painter: T_ADDR },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('imageBase64')
  })

  test('POST /api/gallery/upload — 503 when Pinata creds not configured (test env)', async ({ request }) => {
    // In CI/test environment Pinata credentials may not be set
    // Expect either 503 (no creds) or 200 (creds present, upload worked)
    // Either is acceptable — we just verify no 500 server crash
    const tiny1x1Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const res  = await request.post(`${BASE}/api/gallery/upload`, {
      data: { imageBase64: tiny1x1Png, painter: T_ADDR },
    })
    // 200 = upload worked, 503 = no creds configured, both are valid
    expect([200, 503]).toContain(res.status())
    const body = await res.json()
    expect(body.error !== undefined || body.ok === true).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. 404 FALLBACK
// ─────────────────────────────────────────────────────────────────────────────
test.describe('404 fallback', () => {

  test('Non-existent route returns 404', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/does-not-exist`)
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Not found')
  })

  test('Route at root that does not exist returns 404', async ({ request }) => {
    const res  = await request.get(`${BASE}/nonexistent`)
    expect(res.status()).toBe(404)
  })
})
