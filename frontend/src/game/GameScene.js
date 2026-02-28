import Phaser from 'phaser'
import CastleObject from './CastleObject'

const WORLD_W = 1600
const WORLD_H = 600
const GY      = 420   // main ground Y — trees, decos, player-level grass strip

// Per-castle ground Y — each castle on its own elevated hill
const SLOTS = [
  { wx: 130,  gy: 310, label: 'Ironhold'  },
  { wx: 350,  gy: 270, label: 'Stonepeak' },
  { wx: 620,  gy: 295, label: 'Ashveil'   },
  { wx: 860,  gy: 280, label: 'Dreadfort' },
]

const CHAR_Y        = 530    // player in foreground — 110px below castle ground GY
const CHAR_START_X  = 520    // center of default view
const CHAR_WALK_MIN = 80
const CHAR_WALK_MAX = 960
const PAN_MAX       = 400    // max camera drift from home
const PAN_RETURN    = 0.06   // spring-back speed

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.castleObjects   = []
    this.onAttack        = null
    this.onCastleInfo    = null
    this._projectiles    = []
    this._charGfx        = null
    this._charLabel      = null
    this._charBaseY      = CHAR_Y
    this._knightX        = CHAR_START_X
    this._bobT           = 0
    this._audioCtx       = null
    this._cursors        = null
    this._moveSpeed      = 3.2
    this._charMoving     = false
    this._charFacingLeft = false
  }

  preload() {
    // Archer sprite sheets (primary character)
    this.load.spritesheet('archer_idle',  '/sprites/archer/archer_idle_sheet.png',  { frameWidth: 160, frameHeight: 160 })
    this.load.spritesheet('archer_run',   '/sprites/archer/archer_run_sheet.png',   { frameWidth: 160, frameHeight: 160 })
    this.load.spritesheet('archer_shoot', '/sprites/archer/archer_shoot_sheet.png', { frameWidth: 160, frameHeight: 160 })
    // Knight sprite sheets (fallback if archer not loaded)
    this.load.spritesheet('knight_idle',   '/sprites/knight/idle_sheet.png',   { frameWidth: 125, frameHeight: 150 })
    this.load.spritesheet('knight_run',    '/sprites/knight/run_sheet.png',    { frameWidth: 125, frameHeight: 150 })
    this.load.spritesheet('knight_attack', '/sprites/knight/attack_sheet.png', { frameWidth: 125, frameHeight: 150 })
    this.load.spritesheet('knight_dead',   '/sprites/knight/dead_sheet.png',   { frameWidth: 189, frameHeight: 150 })
  }

  create() {
    this._H = this.scale.height          // actual viewport height (dynamic canvas)
    this.cameras.main.setBounds(0, 0, WORLD_W, Math.max(WORLD_H, this._H))
    this.cameras.main.scrollX = 0
    this.cameras.main.scrollY = 0

    this._drawBg()
    this._drawDecos()
    this._spawnCastles()
    this._createKnightAnims()
    this._drawCharacter()
    this._setupInput()
    this._setupSounds()
  }

  update(time, delta) {
    this._bobT += delta * 0.001
    const dt = delta / 16.67

    // Character movement — fixed camera, walk between defined world bounds
    if (this._cursors) {
      const minX = CHAR_WALK_MIN
      const maxX = CHAR_WALK_MAX

      if (this._cursors.left.isDown) {
        this._knightX = Math.max(minX, this._knightX - this._moveSpeed * dt)
        this._stepTimer = (this._stepTimer || 0) + delta
        if (this._stepTimer > 320) { this._playFootstep(); this._stepTimer = 0 }
      } else if (this._cursors.right.isDown) {
        this._knightX = Math.min(maxX, this._knightX + this._moveSpeed * dt)
        this._stepTimer = (this._stepTimer || 0) + delta
        if (this._stepTimer > 320) { this._playFootstep(); this._stepTimer = 0 }
      } else {
        this._stepTimer = 0
      }
    }

    // Animation state & bob
    const moving = !!(this._cursors?.left.isDown || this._cursors?.right.isDown)
    const facingLeft = this._cursors?.left.isDown || (!this._cursors?.right.isDown && this._charFacingLeft)
    this._charFacingLeft = facingLeft
    const bob = Math.sin(this._bobT * 2.2) * 1.5
    if (this._charGfx) {
      this._charGfx.setX(this._knightX)
      this._charGfx.setY(this._charBaseY + bob)
      if (this._charGfx.setFlipX) this._charGfx.setFlipX(facingLeft)
      if (this._charGfx.anims) {
        const curAnim = this._charGfx.anims.currentAnim?.key
        const idle  = this._charUseArcher ? 'archer_idle'  : 'knight_idle'
        const run   = this._charUseArcher ? 'archer_run'   : 'knight_run'
        const shoot = this._charUseArcher ? 'archer_shoot' : 'knight_attack'
        if (moving && curAnim !== run && curAnim !== shoot)   this._charGfx.play(run)
        if (!moving && curAnim !== idle && curAnim !== shoot) this._charGfx.play(idle)
      }
    }
    if (this._charLabel) this._charLabel.setX(this._knightX)

    // Camera is fixed — all castles are always visible; no panning

    // Projectiles
    this._projectiles = this._projectiles.filter(p => {
      p.t += delta / p.dur
      if (p.t >= 1) {
        p.gfx.destroy()
        this._spawnImpact(p.x1, p.y1)
        this._playImpactSound()
        return false
      }
      const t  = p.t
      const x  = Phaser.Math.Linear(p.x0, p.x1, t)
      const y  = Phaser.Math.Linear(p.y0, p.y1, t) - p.arc * Math.sin(Math.PI * t)
      const t2 = Math.min(t + 0.001, 0.999)
      const x2 = Phaser.Math.Linear(p.x0, p.x1, t2)
      const y2 = Phaser.Math.Linear(p.y0, p.y1, t2) - p.arc * Math.sin(Math.PI * t2)
      p.gfx.setPosition(x, y)
      p.gfx.setRotation(Math.atan2(y2 - y, x2 - x))
      return true
    })
  }

  /* ── BACKGROUND ── bright sky + rolling hills + per-castle elevated mounds ── */
  _drawBg() {
    const H    = this._H || WORLD_H     // actual canvas height (dynamic)
    const VP_Y = 210                    // horizon line Y (same as original bright-sky backup)

    // ═══ SKY — bright cheerful blue gradient ═══
    const sky = this.add.graphics().setDepth(0)
    const skyBands = [0x1E8AC8, 0x2E9ED6, 0x3DB4E4, 0x54C4EE, 0x72D4F4, 0x96E0F8, 0xB8ECF8, 0xD4F4FC]
    const bH = Math.ceil((VP_Y + 20) / skyBands.length) + 1
    skyBands.forEach((col, bi) => { sky.fillStyle(col); sky.fillRect(0, bi * bH, WORLD_W, bH + 2) })
    // Horizon warm haze glow
    sky.fillStyle(0xFFF8C0, 0.35); sky.fillRect(0, VP_Y - 40, WORLD_W, 80)
    sky.fillStyle(0xFFFFFF, 0.20); sky.fillRect(0, VP_Y - 10, WORLD_W, 24)

    // ── Bright Sun (upper-left) ──
    const sunX = 180, sunY = 70
    sky.fillStyle(0xFFEE22); sky.fillCircle(sunX, sunY, 38)
    sky.fillStyle(0xFFFB80, 0.9); sky.fillCircle(sunX - 7, sunY - 8, 16)
    sky.lineStyle(5, 0xFFD500, 0.25); sky.strokeCircle(sunX, sunY, 54)
    sky.lineStyle(3, 0xFFCC00, 0.14); sky.strokeCircle(sunX, sunY, 76)
    sky.lineStyle(3, 0xFFEE44, 0.4)
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2
      sky.lineBetween(sunX + Math.cos(ang)*44, sunY + Math.sin(ang)*44,
                      sunX + Math.cos(ang)*66, sunY + Math.sin(ang)*66)
    }

    // ── Fluffy pixel-art clouds ──
    const cldG = this.add.graphics().setDepth(1)
    const drawCloud = (cx, cy, sc) => {
      const S = n => Math.round(n * sc)
      cldG.fillStyle(0xFFFFFF)
      cldG.fillRect(cx,          cy,          S(88), S(26))
      cldG.fillRect(cx + S(12),  cy - S(16),  S(56), S(22))
      cldG.fillRect(cx + S(24),  cy - S(28),  S(34), S(16))
      cldG.fillRect(cx - S(6),   cy + S(6),   S(20), S(14))
      cldG.fillRect(cx + S(68),  cy + S(4),   S(18), S(16))
      cldG.fillStyle(0xDDF0FF, 0.6)
      cldG.fillRect(cx,          cy + S(18),  S(88), S(8))
    }
    ;[[50, 28, 1.1],  [290, 50, 0.85], [530, 18, 1.2], [760, 42, 0.9],
      [1010, 24, 1.05],[1230, 55, 0.8],[1450, 32, 1.0]
    ].forEach(([cx, cy, sc]) => drawCloud(cx, cy, sc))

    // ── Background rolling hills at horizon — raised 18px vs old positions ──
    const hillG = this.add.graphics().setDepth(1)
    hillG.fillStyle(0x5CAA34)
    ;[[0, VP_Y+1, 300, 88], [240, VP_Y-4, 260, 104], [460, VP_Y+3, 320, 82],
      [740, VP_Y-8, 280, 110],[1000, VP_Y-2, 300, 92],[1260, VP_Y+1, 280, 86],
      [1500, VP_Y-6, 260, 98]
    ].forEach(([hx, hy, hw, hh]) => hillG.fillEllipse(hx + hw/2, hy + hh, hw, hh * 2.2))
    hillG.fillStyle(0x72CC40)
    ;[[60, VP_Y+10, 220, 62],[310, VP_Y+5, 260, 72],[580, VP_Y+8, 200, 58],
      [820, VP_Y+1, 270, 76],[1070, VP_Y+6, 240, 66],[1320, VP_Y+10, 250, 60]
    ].forEach(([hx, hy, hw, hh]) => hillG.fillEllipse(hx + hw/2, hy + hh, hw, hh * 2))

    // ═══ MID-GROUND flat green — horizon to bottom of canvas ═══
    const gndG = this.add.graphics().setDepth(2)
    gndG.fillStyle(0x62C030); gndG.fillRect(0, VP_Y + 20, WORLD_W, H - VP_Y)
    gndG.fillStyle(0x88E044, 0.7); gndG.fillRect(0, VP_Y + 18, WORLD_W, 12)
    gndG.fillStyle(0x78D43C, 0.3); gndG.fillRect(0, VP_Y + 30, WORLD_W, (GY - VP_Y) * 0.5)
    gndG.fillStyle(0x4EAA28, 0.25); gndG.fillRect(0, GY + 20, WORLD_W, H - GY)
    // Player ground highlight strip
    gndG.fillStyle(0x8AEA50, 0.5); gndG.fillRect(0, GY - 2, WORLD_W, 5)

    // ── Per-castle elevated hills — smooth ellipse hill under each castle ──
    const mndG = this.add.graphics().setDepth(2)
    // SLOTS.forEach(slot => {
    //   const hy = slot.gy
    //   const mH = GY - hy
    //   const bx = slot.wx
    //   // Main hill: ellipse centered at ground level — top exactly reaches castle ground
    //   mndG.fillStyle(0x5CAA30)
    //   mndG.fillEllipse(bx, GY + 4, 148, mH * 2 + 8)
    //   // Lighter centre ridge
    //   mndG.fillStyle(0x72C83A)
    //   mndG.fillEllipse(bx, GY + 4, 76, mH * 2 + 8)
    //   // Hilltop grass highlight — matches castle pad width
    //   mndG.fillStyle(0x8AEA50, 0.85); mndG.fillRect(bx - 52, hy - 4, 104, 8)
    //   mndG.fillStyle(0xA8F060, 0.45); mndG.fillRect(bx - 42, hy - 7, 84, 4)
    // })

    // ── Castle stone pads — at each castle's own hill top ──
    const padG = this.add.graphics().setDepth(5)
    SLOTS.forEach(slot => {
      const sy = slot.gy
      // Note: drop shadow removed (was causing the visible dark stripe below castles)
      padG.fillStyle(0xCCBB99); padG.fillRect(slot.wx - 52, sy - 4, 104, 18)
      padG.fillStyle(0xEEDDBB, 0.9); padG.fillRect(slot.wx - 52, sy - 4, 104, 5)
      padG.fillStyle(0x998866, 0.5)
      for (let sc = -44; sc < 48; sc += 16) padG.fillRect(slot.wx + sc, sy + 4, 1, 10)
      padG.lineStyle(1, 0x8A7755, 0.7); padG.strokeRect(slot.wx - 52, sy - 4, 104, 18)
    })
  }

  /* ═══════════════════════════════════════════════════════════════════
   * DECORATIONS — thin coordinator; each element in its own method
   * ═══════════════════════════════════════════════════════════════════ */
  _drawDecos() {
    this._drawTrees()
    this._drawRocks()
    this._drawGs()        // grass clusters
    this._drawGroundArrows()
    this._drawShields()
    this._drawBanners()
  }

  /* ── Helper: pixel-art pine tree ── */
  _drawPixelTree(g, tx, baseY, scale = 1) {
    const S = (n) => Math.round(n * scale)
    g.fillStyle(0x8B5E2E); g.fillRect(tx - S(4), baseY - S(38), S(8), S(38))
    g.fillStyle(0x6A4418); g.fillRect(tx - S(4), baseY - S(38), S(3), S(38))
    g.fillStyle(0xC09060, 0.5); g.fillRect(tx - S(2), baseY - S(36), S(2), S(36))
    g.fillStyle(0x38AA1E); g.fillRect(tx - S(18), baseY - S(54), S(36), S(20))
    g.fillStyle(0x4EC82A); g.fillRect(tx - S(14), baseY - S(68), S(28), S(18))
    g.fillStyle(0x62DD34); g.fillRect(tx - S(10), baseY - S(80), S(20), S(16))
    g.fillStyle(0x7AF040); g.fillRect(tx - S(6),  baseY - S(92), S(12), S(14))
    g.fillStyle(0xA0FF66, 0.8)
    g.fillRect(tx - S(16), baseY - S(52), S(6), S(4))
    g.fillRect(tx - S(12), baseY - S(66), S(5), S(4))
    g.fillRect(tx - S(8),  baseY - S(78), S(4), S(3))
    g.lineStyle(1, 0x1A6008, 0.8)
    g.strokeRect(tx - S(18), baseY - S(54), S(36), S(20))
    g.strokeRect(tx - S(14), baseY - S(68), S(28), S(18))
    g.strokeRect(tx - S(10), baseY - S(80), S(20), S(16))
    g.strokeRect(tx - S(6),  baseY - S(92), S(12), S(14))
  }

  /* ── Helper: round bushy tree ── */
  _drawRoundTree(g, tx, baseY, scale = 1) {
    const S = (n) => Math.round(n * scale)
    g.fillStyle(0x7A4E20); g.fillRect(tx - S(5), baseY - S(50), S(10), S(50))
    g.fillStyle(0x5C3810); g.fillRect(tx - S(5), baseY - S(50), S(3), S(50))
    g.fillStyle(0x2E9918); g.fillEllipse(tx, baseY - S(62), S(66), S(58))
    g.fillStyle(0x42B822); g.fillEllipse(tx - S(8), baseY - S(74), S(48), S(44))
    g.fillStyle(0x5ACC34); g.fillEllipse(tx + S(7), baseY - S(58), S(36), S(32))
    g.fillStyle(0x78E848, 0.7); g.fillEllipse(tx - S(4), baseY - S(84), S(24), S(22))
  }

  /* ── Helper: pixel rock ── */
  _drawPixelRock(g, rx, ry, w, h) {
    g.fillStyle(0x888888); g.fillRect(rx, ry, w, h)
    g.fillStyle(0x666666); g.fillRect(rx, ry + h - 4, w, 4)
    g.fillStyle(0xAAAAAA); g.fillRect(rx + 2, ry + 2, Math.round(w * 0.5), 3)
    g.fillStyle(0x555555); g.fillRect(rx + w - 2, ry, 2, h)
    g.lineStyle(1, 0x444444, 0.8); g.strokeRect(rx, ry, w, h)
  }

  /* ── Helper: ground arrow (battle litter) ── */
  _drawGroundArrow(g, ax, ay, tilt = 0) {
    const rot = -Math.PI * 0.46 + tilt
    const cos = Math.cos(rot), sin = Math.sin(rot)
    const len = 22
    g.lineStyle(3, 0xb88040)
    g.lineBetween(ax, ay, ax + cos * len, ay + sin * len)
    const tx2 = ax + cos * len, ty2 = ay + sin * len
    const perp = rot + Math.PI / 2
    g.fillStyle(0x777777)
    g.fillTriangle(
      tx2 + Math.cos(perp) * 4, ty2 + Math.sin(perp) * 4,
      tx2 - Math.cos(perp) * 4, ty2 - Math.sin(perp) * 4,
      tx2 + cos * 7, ty2 + sin * 7,
    )
    g.fillStyle(0xcc4444, 0.9)
    g.fillTriangle(
      ax + Math.cos(perp) * 5, ay + Math.sin(perp) * 5,
      ax - Math.cos(perp) * 5, ay - Math.sin(perp) * 5,
      ax - cos * 5, ay - sin * 5,
    )
  }

  /* ── Helper: shield prop ── */
  _drawShield(g, sx, sy, col) {
    g.fillStyle(col)
    g.fillRoundedRect(sx - 8, sy - 14, 16, 18, { tl: 3, tr: 3, bl: 7, br: 7 })
    g.fillStyle(0xffffff, 0.28); g.fillRect(sx - 7, sy - 13, 14, 5)
    g.fillStyle(0x000000, 0.28)
    g.fillRoundedRect(sx - 1, sy - 14, 2, 18, 1)
    g.lineStyle(1.5, 0x000000, 0.5)
    g.strokeRoundedRect(sx - 8, sy - 14, 16, 18, { tl: 3, tr: 3, bl: 7, br: 7 })
  }

  /* ── Helper: single grass blade — thin upward triangle, slight lean ── */
  _drawGrassBlade(g, bx, by, h, w, col, lean = 0) {
    // tip leans: positive lean → right, negative → left
    g.fillStyle(col, 0.92)
    g.fillTriangle(bx - w, by, bx + w, by, bx + lean, by - h)
  }

  /* ── Helper: one grass tuft — ~10 blades grouped at the same base Y ──
   *  cx/cy = center of the tuft; all blades share cy as their base.
   *  Color theme shifts slightly per variant index so nearby tufts look distinct. */
  _drawGrassTuft(g, cx, cy, variant = 0) {
    // Blade templates: [dx, height, halfWidth, color, lean-offset]
    const palettes = [
      [0x4EC828, 0x5AD432, 0x6AE03C, 0x78E848, 0x8AEE50],
      [0x42C020, 0x56D62E, 0x68E040, 0x7AEA50, 0x94F460],
      [0x4AC426, 0x60DA36, 0x72E844, 0x88F25A, 0x9AFF6A],
    ]
    const pal = palettes[variant % palettes.length]
    // Fixed blade layout — 10 blades, spread ±28px from center
    const blades = [
      { dx: -26, h: 10, w: 2.0, ci: 4, lean:  1 },
      { dx: -20, h: 14, w: 2.5, ci: 0, lean: -2 },
      { dx: -14, h: 11, w: 2.0, ci: 2, lean:  1 },
      { dx:  -8, h: 16, w: 2.5, ci: 1, lean: -1 },
      { dx:  -2, h: 13, w: 2.0, ci: 3, lean:  2 },
      { dx:   4, h: 17, w: 2.5, ci: 0, lean: -2 },
      { dx:  10, h: 12, w: 2.0, ci: 2, lean:  1 },
      { dx:  16, h: 15, w: 2.5, ci: 1, lean: -1 },
      { dx:  22, h: 11, w: 2.0, ci: 3, lean:  2 },
      { dx:  27, h:  9, w: 2.0, ci: 4, lean: -1 },
    ]
    // Thin dark-green base line — gives the group a ground anchor
    g.fillStyle(0x2A6012, 0.35)
    g.fillRect(cx - 30, cy - 2, 58, 2)
    // Draw each blade
    blades.forEach(({ dx, h, w, ci, lean }) => {
      this._drawGrassBlade(g, cx + dx, cy, h, w, pal[ci], lean)
    })
  }

  /* ── Trees — 5 scattered, alternating pixel / round style ── */
  _drawTrees() {
    const g = this.add.graphics().setDepth(3)
    ;[
      [45,  GY, 1.45],
      [300, GY, 1.20],
      [502, GY, 1.30],
      [722, GY, 1.52],
      [936, GY, 1.44],
    ].forEach(([tx, ty, s], i) => {
      if (i % 3 === 1) this._drawRoundTree(g, tx, ty, s)
      else             this._drawPixelTree(g, tx, ty, s)
    })
  }

  /* ── Rocks — 8 scattered stones ── */
  _drawRocks() {
    const g = this.add.graphics().setDepth(3)
    ;[
      [52,  GY - 9,  14, 8], [170, GY - 10, 22, 10],
      [462, GY - 12, 18, 12], [638, GY - 9,  16,  9],
      [842, GY - 11, 20, 11], [1122, GY - 10, 18, 10],
      [1336, GY - 12, 22, 12], [1528, GY - 9, 16, 9],
    ].forEach(([rx, ry, w, h]) => this._drawPixelRock(g, rx, ry, w, h))
  }

  /* ── Grass clusters — 11 groups of ~10 blades, all at ground level ──
   *  Placed in open stretches between trees/castles/rocks.
   *  Variant index rotates palette so adjacent tufts look distinct. */
  _drawGs() {
    const g = this.add.graphics().setDepth(3)
    ;[
      [100,  GY, 0],
      [230,  GY, 1],
      [410,  GY, 2],
      [555,  GY, 0],
      [670,  GY, 1],
      [795,  GY, 2],
      [975,  GY, 0],
      [1070, GY, 1],
      [1200, GY, 2],
      [1350, GY, 0],
      [1490, GY, 1],
    ].forEach(([cx, cy, variant]) => this._drawGrassTuft(g, cx, cy, variant))
  }

  /* ── Ground arrows — 18 battle-litter shafts ── */
  _drawGroundArrows() {
    const g = this.add.graphics().setDepth(4)
    ;[
      [142, GY - 3, -0.12], [208, GY - 1,  0.16], [278, GY - 4, -0.22],
      [338, GY - 2,  0.08], [398, GY - 5, -0.18], [444, GY - 1,  0.26],
      [488, GY - 3,  0.07], [534, GY - 2, -0.14], [578, GY - 4,  0.19],
      [624, GY - 1, -0.08], [668, GY - 3,  0.13], [714, GY - 5, -0.20],
      [758, GY - 2,  0.23], [808, GY - 1, -0.10], [844, GY - 3,  0.17],
      [882, GY - 2, -0.19], [918, GY - 4,  0.09], [952, GY - 1, -0.13],
    ].forEach(([ax, ay, tilt]) => this._drawGroundArrow(g, ax, ay, tilt))
  }

  /* ── Shields — 5 coloured dropped shields ── */
  _drawShields() {
    const g = this.add.graphics().setDepth(4)
    ;[
      [180, GY - 14, 0xcc2200], [420, GY - 14, 0x1155cc],
      [560, GY - 14, 0x229922], [770, GY - 14, 0xcc8800],
      [900, GY - 14, 0xaa2200],
    ].forEach(([sx, sy, col]) => this._drawShield(g, sx, sy, col))
  }

  /* ── Banner poles — one next to each castle ── */
  _drawBanners() {
    const g = this.add.graphics().setDepth(4)
    const bannerCols = [0xff3322, 0x22aaff, 0xff9900, 0x44dd22]
    SLOTS.forEach((slot, i) => {
      const px = slot.wx + 64, sy = slot.gy, PH = 88
      g.fillStyle(0x6B4510); g.fillRect(px, sy - PH, 4, PH)
      g.fillStyle(0x9A6530, 0.5); g.fillRect(px + 1, sy - PH, 1, PH)
      g.fillStyle(bannerCols[i])
      g.fillTriangle(px + 4, sy - PH, px + 30, sy - PH + 14, px + 4, sy - PH + 28)
      g.fillStyle(0xffffff, 0.35); g.fillRect(px + 5, sy - PH + 2, 12, 4)
      g.fillStyle(0xFFD700); g.fillRect(px - 1, sy - PH - 5, 6, 6)
      g.fillStyle(0xFFFFAA, 0.6); g.fillRect(px, sy - PH - 4, 2, 2)
    })
  }

  /* ── CASTLES ────────────────────────────────────── */
  _spawnCastles() {
    SLOTS.forEach((slot, i) => {
      const castle = new CastleObject(this, slot.wx, slot.gy, i, slot.label)
      castle.setClickCallback(() => {
        if (castle._fallen) return
        // Let the React parent handle attack logic & call animateAttack back
        this.onAttack?.(i)
      })
      castle.setInfoCallback(() => this.onCastleInfo?.(i))
      this.castleObjects.push(castle)
    })
  }

  /* ── ARCHER + KNIGHT ANIMATIONS ───────────────── */
  _createKnightAnims() {
    // Archer animations (primary)
    if (!this.anims.exists('archer_idle')) {
      this.anims.create({ key: 'archer_idle',  frames: this.anims.generateFrameNumbers('archer_idle',  { start: 0, end: 9  }), frameRate: 9,  repeat: -1 })
    }
    if (!this.anims.exists('archer_run')) {
      this.anims.create({ key: 'archer_run',   frames: this.anims.generateFrameNumbers('archer_run',   { start: 0, end: 21 }), frameRate: 16, repeat: -1 })
    }
    if (!this.anims.exists('archer_shoot')) {
      this.anims.create({ key: 'archer_shoot', frames: this.anims.generateFrameNumbers('archer_shoot', { start: 0, end: 21 }), frameRate: 22, repeat: 0  })
    }
    // Knight fallback animations
    if (!this.anims.exists('knight_idle')) {
      this.anims.create({ key: 'knight_idle',   frames: this.anims.generateFrameNumbers('knight_idle',   { start: 0, end: 9 }), frameRate: 9,  repeat: -1 })
    }
    if (!this.anims.exists('knight_run')) {
      this.anims.create({ key: 'knight_run',    frames: this.anims.generateFrameNumbers('knight_run',    { start: 0, end: 9 }), frameRate: 14, repeat: -1 })
    }
    if (!this.anims.exists('knight_attack')) {
      this.anims.create({ key: 'knight_attack', frames: this.anims.generateFrameNumbers('knight_attack', { start: 0, end: 9 }), frameRate: 14, repeat: 0  })
    }
  }

  /* ── CHARACTER DRAWING ─────────────────────────── */
  _drawCharacter() {
    const x = this._knightX
    const y = this._charBaseY
    // Always use knight (sword+shield) character
    const useArcher = false
    const useKnight = this.textures.exists('knight_idle') && this.textures.get('knight_idle').key !== '__MISSING'

    if (useArcher) {
      // archer branch disabled
    } else if (useKnight) {
      const sprite = this.add.sprite(x, y, 'knight_idle', 0)
        .setOrigin(0.5, 1)
        .setDisplaySize(118, 142)
        .setDepth(20)
      sprite.play('knight_idle')
      sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'knight_attack', () => {
        sprite.play('knight_idle')
      })
      this._charGfx = sprite
      this._charUseArcher = false
    } else {
      const g = this.add.graphics().setPosition(x, y).setDepth(20)
      g.fillStyle(0x9999cc, 0.9); g.fillRoundedRect(-18, -70, 36, 70, 4)
      this._charGfx = g
      this._charUseArcher = false
    }
    const uname = (typeof localStorage !== 'undefined' && localStorage.getItem('mc_username')) || 'Warrior'
    this._charLabel = this.add.text(x, y + 16, `▸ ${uname.toUpperCase()} ◂`, {
      fontSize: '9px', fontFamily: 'monospace',
      color: '#ffffff', stroke: '#000000', strokeThickness: 4,
      backgroundColor: '#33335588',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(21)
  }

  /* ── INPUT ──────────────────────────────────────── */
  _setupInput() {
    this._cursors = this.input.keyboard.createCursorKeys()
    // Drag-to-pan removed intentionally
  }

  /* ── SOUNDS ─────────────────────────────────────── */
  _setupSounds() {
    this._muted = false
    // Web Audio requires a user gesture — pre-warm context on first interaction
    const tryResume = () => {
      if (!this._audioCtx) this._getAudioCtx()
      this._resume()
    }
    document.addEventListener('click',   tryResume, { once: true })
    document.addEventListener('keydown', tryResume, { once: true })
  }
  _getAudioCtx() {
    if (!this._audioCtx) {
      try { this._audioCtx = new (window.AudioContext || window.webkitAudioContext)() } catch (e) {}
    }
    return this._audioCtx
  }
  _resume() { if (this._audioCtx?.state === 'suspended') this._audioCtx.resume() }
  setMuted(m) { this._muted = !!m }

  _beep(type, freq1, freq2, dur, vol = 0.22) {
    if (this._muted) return
    const ctx = this._getAudioCtx()
    if (!ctx) return
    this._resume()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = type
    o.frequency.setValueAtTime(freq1, ctx.currentTime)
    if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + dur)
    g.gain.setValueAtTime(vol, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur + 0.02)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + dur + 0.04)
  }

  _playShootSound()    { this._beep('triangle', 880, 260, 0.12, 0.22) }
  _playImpactSound()   { this._beep('sawtooth',  180,  55, 0.18, 0.28) }
  _playFootstep()      { this._beep('sine',       95,  80, 0.06, 0.08) }
  _playMenuClick()     { this._beep('square',    660, 880, 0.04, 0.10) }

  _playCapture() {
    if (this._muted) return
    const ctx = this._getAudioCtx()
    if (!ctx) return
    this._resume()
    ;[[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32], [1319, 0.46]].forEach(([freq, delay]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'triangle'; o.frequency.value = freq
      g.gain.setValueAtTime(0, ctx.currentTime + delay)
      g.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delay + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.38)
      o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + 0.42)
    })
  }

  _playWinSound() {
    if (this._muted) return
    const ctx = this._getAudioCtx()
    if (!ctx) return
    this._resume()
    ;[[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]].forEach(([freq, delay]) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'triangle'; o.frequency.value = freq
      g.gain.setValueAtTime(0, ctx.currentTime + delay)
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3)
      o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + 0.35)
    })
  }

  /* ── PROJECTILE — drawn arrow that rotates with trajectory ─────── */
  _fireProjectile(castleId) {
    const castle = this.castleObjects[castleId]
    if (!castle) return
    const sx   = this._knightX
    const sy   = this._charBaseY - 58   // fire from character's shoulder height
    const ex   = castle.wx
    const ey   = (castle.groundY || GY) - 80   // aim at castle mid-wall
    // Flip character to face the target castle on the X axis
    if (this._charGfx?.setFlipX) {
      const faceLeft = ex < sx
      this._charGfx.setFlipX(faceLeft)
      this._charFacingLeft = faceLeft
    }
    const dist = Phaser.Math.Distance.Between(sx, sy, ex, ey)
    const dur  = Phaser.Math.Clamp(dist * 0.32, 140, 380)
    const arc  = dist * 0.14
    const castleCols = [0xff4d4d, 0x4db8ff, 0x4dff91, 0xffd94d]
    const cc = castleCols[castleId] || 0xffaa00

    // Energy bolt — glowing power projectile launched by knight (rotates with trajectory)
    const gfx = this.add.graphics().setDepth(45)
    // Outer halo
    gfx.fillStyle(0xFFFFCC, 0.16); gfx.fillEllipse(0, 0, 58, 24)
    // Mid glow ring
    gfx.fillStyle(cc, 0.40); gfx.fillEllipse(0, 0, 44, 16)
    // Bright core bolt
    gfx.fillStyle(0xffffff, 1.0); gfx.fillEllipse(0, 0, 28, 10)
    gfx.fillStyle(cc,       1.0); gfx.fillEllipse(0, 0, 22, 8)
    // Centre spark
    gfx.fillStyle(0xffffff, 1.0); gfx.fillCircle(0, 0, 4)
    // Trailing fading tail
    gfx.fillStyle(cc, 0.55); gfx.fillEllipse(-20, 0, 14, 6)
    gfx.fillStyle(cc, 0.28); gfx.fillEllipse(-30, 0, 9, 4)

    gfx.setPosition(sx, sy)
    this._projectiles.push({ gfx, x0: sx, y0: sy, x1: ex, y1: ey, arc, dur, t: 0 })

    // Always (re)start attack animation when firing
    if (this._charGfx?.anims) {
      if (this._charUseArcher) {
        this._charGfx.play('archer_shoot')
      } else {
        this._charGfx.play('knight_attack')
      }
    } else {
      this.tweens.add({ targets: this._charGfx, alpha: 0.55, duration: 55, yoyo: true, repeat: 1 })
    }
  }

  _spawnImpact(x, y) {
    // Energy burst on castle wall
    const f = this.add.graphics().setPosition(x, y).setDepth(60)
    // Outer shockwave rings
    f.lineStyle(3, 0xffdd44, 0.85); f.strokeCircle(0, 0, 15)
    f.lineStyle(2, 0xff9900, 0.55); f.strokeCircle(0, 0, 24)
    // Core flash
    f.fillStyle(0xffffff, 0.95); f.fillCircle(0, 0, 9)
    f.fillStyle(0xffcc00, 0.90); f.fillCircle(0, 0, 16)
    f.fillStyle(0xffffff, 1.00); f.fillCircle(0, 0, 5)
    // Flying debris sparks
    for (let i = 0; i < 5; i++) {
      const sx = Phaser.Math.Between(-18, 18), sy = Phaser.Math.Between(-18, 18)
      f.fillStyle(0xffaa00, 0.8); f.fillRect(sx - 1, sy - 2, 3, 3)
    }
    this.tweens.add({ targets: f, alpha: 0, scaleX: 2.6, scaleY: 2.6, duration: 330, ease: 'Power2', onComplete: () => f.destroy() })
  }

  /* ── PUBLIC API ─────────────────────────────────── */
  // Character selection removed — knight sprite always used
  setCharacter(_charId) {
    if (this._charGfx)   { this._charGfx.destroy();   this._charGfx   = null }
    if (this._charLabel) { this._charLabel.destroy();  this._charLabel = null }
    this._drawCharacter()
  }

  updateCastle(id, data) { this.castleObjects[id]?.updateFromChain(data) }

  animateAttack(id) {
    this._fireProjectile(id)
    this._playShootSound()
    this.castleObjects[id]?.playAttackEffect()
  }

  animateFall(id, winner, cb) {
    this._playWinSound()
    this.castleObjects[id]?.playFallEffect(winner, () => { cb?.() })
  }
}
