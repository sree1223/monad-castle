/**
 * make_sheets.js — Stitch individual archer PNGs into horizontal sprite sheets.
 * Run: node make_sheets.js
 *
 * Output (in parent /archer folder):
 *   archer_idle_sheet.png   — 10 frames, each resized to 160×160
 *   archer_run_sheet.png    — 22 frames, each resized to 160×160
 *   archer_shoot_sheet.png  — 22 frames, each resized to 160×160
 */

const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const FRAME_SIZE = 160   // output frame size (square, power of 2-ish)
const DIR = path.join(__dirname, '2D_Archer_Spritesheets_1024x1024')
const OUT_DIR = __dirname

const SETS = [
  {
    out:    'archer_idle_sheet.png',
    dir:    path.join(DIR, 'Idle'),
    frames: range(0, 9).map(i => `idle_test_${pad(i)}.png`),
  },
  {
    out:    'archer_run_sheet.png',
    dir:    path.join(DIR, 'Run_Idle'),
    frames: range(0, 21).map(i => `run_idle_${pad(i)}.png`),
  },
  {
    out:    'archer_shoot_sheet.png',
    dir:    path.join(DIR, 'Shoot_Stand'),
    frames: range(0, 21).map(i => `shoot_stand_${pad(i)}.png`),
  },
]

function range(a, b) {
  const r = []
  for (let i = a; i <= b; i++) r.push(i)
  return r
}
function pad(n) { return String(n).padStart(3, '0') }

async function stitchSheet({ out, dir, frames }) {
  console.log(`\nBuilding ${out} (${frames.length} frames at ${FRAME_SIZE}px)…`)
  const W = frames.length * FRAME_SIZE

  // Resize every frame to FRAME_SIZE×FRAME_SIZE, extract raw RGBA buffer
  const buffers = await Promise.all(
    frames.map(async (f, i) => {
      const fp = path.join(dir, f)
      if (!fs.existsSync(fp)) {
        console.warn(`  MISSING: ${f} — skipping`)
        return null
      }
      const buf = await sharp(fp)
        .resize(FRAME_SIZE, FRAME_SIZE, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
        .raw()
        .toBuffer()
      if (i % 5 === 0) process.stdout.write('.')
      return buf
    })
  )

  // Combine into one big RGBA buffer arranged horizontally
  const sheetBuf = Buffer.alloc(W * FRAME_SIZE * 4, 0)
  buffers.forEach((buf, fi) => {
    if (!buf) return
    for (let row = 0; row < FRAME_SIZE; row++) {
      const srcOff = row * FRAME_SIZE * 4
      const dstOff = (row * W + fi * FRAME_SIZE) * 4
      buf.copy(sheetBuf, dstOff, srcOff, srcOff + FRAME_SIZE * 4)
    }
  })

  // Save as PNG
  const outPath = path.join(OUT_DIR, out)
  await sharp(sheetBuf, { raw: { width: W, height: FRAME_SIZE, channels: 4 } })
    .png()
    .toFile(outPath)
  console.log(`\n  ✓ Saved ${out} (${W}×${FRAME_SIZE})`)
}

;(async () => {
  for (const set of SETS) {
    await stitchSheet(set)
  }
  console.log('\nAll sheets created! Update GameScene.js to use archer sprites.')
})().catch(console.error)
