import Phaser from 'phaser'
import CastleObject from './CastleObject'

const WORLD_W = 1600
const WORLD_H = 600
const GY = 420        // ground Y — 70% down; castle towers extend up into upper half

// All 4 castles fit within ~1040px default canvas width
const SLOTS = [
  { wx: 110,  label: 'Ironhold'  },
  { wx: 390,  label: 'Stonepeak' },
  { wx: 740,  label: 'Ashveil'   },
  { wx: 1030, label: 'Dreadfort' },
]

const CHAR_Y        = 530    // character near-ground Y (visually closer than castles)
const CHAR_START_X  = 520    // center of default view
const CHAR_WALK_MIN = 80
const CHAR_WALK_MAX = 1050
const PAN_MAX       = 400    // max camera drift from home
const PAN_RETURN    = 0.06   // spring-back speed

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.castleObjects  = []
    this.onAttack       = null
    this.onCastleInfo   = null
    this._projectiles   = []
    this._charGfx       = null
    this._charLabel     = null
    this._charBaseY     = CHAR_Y
    this._knightX       = CHAR_START_X
    this._bobT          = 0
    this._audioCtx      = null
    this._cursors       = null
    this._moveSpeed     = 3.2
    this._isDragging    = false
    this._dragStartX    = 0
    this._dragStartCamX = 0
    this._panTarget     = 0
    this._charMoving    = false
    this._charFacingLeft = false
  }

  preload() {
    // Knight sprite sheets — always available (locally served)
    this.load.spritesheet('knight_idle',   '/sprites/knight/idle_sheet.png',   { frameWidth: 125, frameHeight: 150 })
    this.load.spritesheet('knight_run',    '/sprites/knight/run_sheet.png',    { frameWidth: 125, frameHeight: 150 })
    this.load.spritesheet('knight_attack', '/sprites/knight/attack_sheet.png', { frameWidth: 125, frameHeight: 150 })
    this.load.spritesheet('knight_dead',   '/sprites/knight/dead_sheet.png',   { frameWidth: 189, frameHeight: 150 })
  }

  create() {
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H)
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

    // Character movement — stays clamped to visible viewport
    if (this._cursors) {
      const viewStart = this.cameras.main.scrollX
      const viewEnd   = viewStart + this.cameras.main.width
      const minX = Math.max(CHAR_WALK_MIN, viewStart + 60)
      const maxX = Math.min(CHAR_WALK_MAX, viewEnd   - 60)

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
        if (moving && curAnim !== 'knight_run')    this._charGfx.play('knight_run')
        if (!moving && curAnim !== 'knight_idle') this._charGfx.play('knight_idle')
      }
    }
    if (this._charLabel) this._charLabel.setX(this._knightX)

    // Camera spring-back to home when not dragging
    if (!this._isDragging) {
      const cx = this.cameras.main.scrollX
      if (Math.abs(cx - this._panTarget) > 0.5) {
        this.cameras.main.scrollX = Phaser.Math.Linear(cx, this._panTarget, PAN_RETURN)
      } else {
        this.cameras.main.scrollX = this._panTarget
      }
    }

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

  /* ── BACKGROUND ── bright cheerful 8-bit style ── */
  _drawBg() {
    const VP_Y = 210   // horizon line Y

    // ═══ SKY — bright cheerful blue gradient ═══
    const sky = this.add.graphics().setDepth(0)
    // Bands from top (deep blue-sky) to horizon (light airy)
    const skyBands = [0x1E8AC8, 0x2E9ED6, 0x3DB4E4, 0x54C4EE, 0x72D4F4, 0x96E0F8, 0xB8ECF8, 0xD4F4FC]
    const bH = Math.ceil((VP_Y + 20) / skyBands.length) + 1
    skyBands.forEach((col, bi) => { sky.fillStyle(col); sky.fillRect(0, bi * bH, WORLD_W, bH + 2) })

    // Horizon warm haze glow — light golden
    sky.fillStyle(0xFFF8C0, 0.35); sky.fillRect(0, VP_Y - 40, WORLD_W, 80)
    sky.fillStyle(0xFFFFFF, 0.20); sky.fillRect(0, VP_Y - 10, WORLD_W, 24)

    // ── Bright Sun (upper-left area) ──
    const sunX = 180, sunY = 70
    sky.fillStyle(0xFFEE22); sky.fillCircle(sunX, sunY, 38)
    sky.fillStyle(0xFFFB80, 0.9); sky.fillCircle(sunX - 7, sunY - 8, 16)
    sky.lineStyle(5, 0xFFD500, 0.25); sky.strokeCircle(sunX, sunY, 54)
    sky.lineStyle(3, 0xFFCC00, 0.14); sky.strokeCircle(sunX, sunY, 76)
    // Sun rays (pixel style — 8 lines)
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
      cldG.fillRect(cx - S(6),   cy + S(6),   S(20), S(14))  // left puff
      cldG.fillRect(cx + S(68),  cy + S(4),   S(18), S(16))  // right puff
      cldG.fillStyle(0xDDF0FF, 0.6)
      cldG.fillRect(cx,          cy + S(18),  S(88), S(8))   // shadow bottom
    }
    ;[[50, 28, 1.1],  [290, 50, 0.85], [530, 18, 1.2], [760, 42, 0.9],
      [1010, 24, 1.05],[1230, 55, 0.8],[1450, 32, 1.0]
    ].forEach(([cx, cy, sc]) => drawCloud(cx, cy, sc))

    // ── Bright rolling hills at horizon ──
    const hillG = this.add.graphics().setDepth(1)
    // Back hills (slightly darker shade)
    hillG.fillStyle(0x5CAA34)
    ;[[0, VP_Y+18, 300, 80], [240, VP_Y+12, 260, 95], [460, VP_Y+20, 320, 75],
      [740, VP_Y+8, 280, 100],[1000, VP_Y+14, 300, 85],[1260, VP_Y+18, 280, 78],
      [1500, VP_Y+10, 260, 90]
    ].forEach(([hx, hy, hw, hh]) => hillG.fillEllipse(hx + hw/2, hy + hh, hw, hh * 2.2))
    // Front hills (brighter)
    hillG.fillStyle(0x72CC40)
    ;[[60, VP_Y+28, 220, 56],[310, VP_Y+22, 260, 66],[580, VP_Y+26, 200, 52],
      [820, VP_Y+18, 270, 70],[1070, VP_Y+24, 240, 60],[1320, VP_Y+28, 250, 54]
    ].forEach(([hx, hy, hw, hh]) => hillG.fillEllipse(hx + hw/2, hy + hh, hw, hh * 2))

    // ═══ MID-GROUND — bright grass from horizon to bottom ═══
    const gndG = this.add.graphics().setDepth(2)
    // Solid bright grass fill covering VP_Y → WORLD_H
    gndG.fillStyle(0x62C030); gndG.fillRect(0, VP_Y + 20, WORLD_W, WORLD_H - VP_Y)
    // Top grass highlight strip
    gndG.fillStyle(0x88E044, 0.7); gndG.fillRect(0, VP_Y + 18, WORLD_W, 12)
    // Subtle depth bands (lighter in mid, slightly darker near bottom)
    gndG.fillStyle(0x78D43C, 0.3); gndG.fillRect(0, VP_Y + 30, WORLD_W, (GY - VP_Y) * 0.5)
    gndG.fillStyle(0x4EAA28, 0.25); gndG.fillRect(0, GY + 20, WORLD_W, WORLD_H - GY)
    // Ground line at castle base
    gndG.fillStyle(0x8AEA50, 0.5); gndG.fillRect(0, GY - 2, WORLD_W, 5)

    // Castle stone pads — brighter, more visible
    const padG = this.add.graphics().setDepth(5)
    SLOTS.forEach(slot => {
      // Shadow
      padG.fillStyle(0x3A5010, 0.3); padG.fillRect(slot.wx - 52+4, GY + 14, 104, 6)
      // Main stone slab
      padG.fillStyle(0xCCBB99); padG.fillRect(slot.wx - 52, GY - 4, 104, 18)
      // Top highlight
      padG.fillStyle(0xEEDDBB, 0.9); padG.fillRect(slot.wx - 52, GY - 4, 104, 5)
      // Stone seams
      padG.fillStyle(0x998866, 0.5)
      for (let sc = -44; sc < 48; sc += 16) padG.fillRect(slot.wx + sc, GY + 4, 1, 10)
      // Outline
      padG.lineStyle(1, 0x8A7755, 0.7); padG.strokeRect(slot.wx - 52, GY - 4, 104, 18)
    })
  }

  /* ── DECORATIONS ── pixel-art trees, rocks, banners ── */
  _drawDecos() {
    // PIXEL-ART TREE: stacked flat rectangles, dark outlines
    const drawPixelTree = (g, tx, scale = 1) => {
      const S = (n) => Math.round(n * scale)
      const baseY = GY
      // Trunk — warm brown
      g.fillStyle(0x8B5E2E); g.fillRect(tx - S(4), baseY - S(38), S(8), S(38))
      g.fillStyle(0x6A4418); g.fillRect(tx - S(4), baseY - S(38), S(3), S(38))
      g.fillStyle(0xC09060, 0.5); g.fillRect(tx - S(2), baseY - S(36), S(2), S(36))
      // Foliage — bright greens
      g.fillStyle(0x38AA1E); g.fillRect(tx - S(18), baseY - S(54), S(36), S(20))
      g.fillStyle(0x4EC82A); g.fillRect(tx - S(14), baseY - S(68), S(28), S(18))
      g.fillStyle(0x62DD34); g.fillRect(tx - S(10), baseY - S(80), S(20), S(16))
      g.fillStyle(0x7AF040); g.fillRect(tx - S(6),  baseY - S(92), S(12), S(14))
      // Highlights
      g.fillStyle(0xA0FF66, 0.8)
      g.fillRect(tx - S(16), baseY - S(52), S(6), S(4))
      g.fillRect(tx - S(12), baseY - S(66), S(5), S(4))
      g.fillRect(tx - S(8),  baseY - S(78), S(4), S(3))
      // Dark border outlines
      g.lineStyle(1, 0x1A6008, 0.8)
      g.strokeRect(tx - S(18), baseY - S(54), S(36), S(20))
      g.strokeRect(tx - S(14), baseY - S(68), S(28), S(18))
      g.strokeRect(tx - S(10), baseY - S(80), S(20), S(16))
      g.strokeRect(tx - S(6),  baseY - S(92), S(12), S(14))
    }

    const drawPixelRock = (g, rx, ry, w, h) => {
      g.fillStyle(0x888888); g.fillRect(rx, ry, w, h)
      g.fillStyle(0x666666); g.fillRect(rx, ry + h - 4, w, 4)       // shadow bottom
      g.fillStyle(0xAAAAAA); g.fillRect(rx + 2, ry + 2, Math.round(w * 0.5), 3)  // highlight
      g.fillStyle(0x555555); g.fillRect(rx + w - 2, ry, 2, h)       // right edge dark
      g.lineStyle(1, 0x444444, 0.8); g.strokeRect(rx, ry, w, h)
    }

    const treeG = this.add.graphics().setDepth(3)
    // Trees between castles
    ;[
      [200, 1.0], [240, 0.82], [222, 0.92],
      [488, 1.1], [522, 0.88],
      [668, 0.94], [706, 1.04], [688, 0.80],
      [870, 1.0], [906, 0.88],
      [1090, 1.08], [1122, 0.85],
      [1348, 1.0], [1386, 0.90], [1368, 0.78],
    ].forEach(([tx, s]) => drawPixelTree(treeG, tx, s))

    // Pixel rocks
    const rockG = this.add.graphics().setDepth(3)
    ;[
      [170, GY - 10, 22, 10], [462, GY - 12, 18, 12], [648, GY - 9, 16, 9],
      [848, GY - 11, 20, 11], [1062, GY - 10, 18, 10], [1334, GY - 12, 22, 12],
    ].forEach(([rx, ry, w, h]) => drawPixelRock(rockG, rx, ry, w, h))

    // Pixel banner poles near each castle
    const bannerG = this.add.graphics().setDepth(4)
    const bannerCols = [0xff3322, 0x22aaff, 0xff9900, 0x44dd22]
    SLOTS.forEach((slot, i) => {
      const px = slot.wx + 64
      const PH = 88
      // Pole
      bannerG.fillStyle(0x6B4510); bannerG.fillRect(px, GY - PH, 4, PH)
      bannerG.fillStyle(0x9A6530, 0.5); bannerG.fillRect(px + 1, GY - PH, 1, PH) // lite
      // Pennant: flat triangle made of rectangles (pixel style)
      bannerG.fillStyle(bannerCols[i])
      bannerG.fillTriangle(px + 4, GY - PH, px + 30, GY - PH + 14, px + 4, GY - PH + 28)
      bannerG.fillStyle(0xffffff, 0.35); bannerG.fillRect(px + 5, GY - PH + 2, 12, 4)
      // Finial
      bannerG.fillStyle(0xFFD700); bannerG.fillRect(px - 1, GY - PH - 5, 6, 6)
      bannerG.fillStyle(0xFFFFAA, 0.6); bannerG.fillRect(px, GY - PH - 4, 2, 2)
    })
  }

  /* ── CASTLES ────────────────────────────────────── */
  _spawnCastles() {
    SLOTS.forEach((slot, i) => {
      const castle = new CastleObject(this, slot.wx, GY, i, slot.label)
      castle.setClickCallback(() => {
        if (castle._fallen) return
        // Let the React parent handle attack logic & call animateAttack back
        this.onAttack?.(i)
      })
      castle.setInfoCallback(() => this.onCastleInfo?.(i))
      this.castleObjects.push(castle)
    })
  }

  /* ── KNIGHT ANIMATIONS ─────────────────────────── */
  _createKnightAnims() {
    if (!this.anims.exists('knight_idle')) {
      this.anims.create({ key: 'knight_idle', frames: this.anims.generateFrameNumbers('knight_idle', { start: 0, end: 9 }), frameRate: 9, repeat: -1 })
    }
    if (!this.anims.exists('knight_run')) {
      this.anims.create({ key: 'knight_run',  frames: this.anims.generateFrameNumbers('knight_run',  { start: 0, end: 9 }), frameRate: 14, repeat: -1 })
    }
    if (!this.anims.exists('knight_attack')) {
      this.anims.create({ key: 'knight_attack', frames: this.anims.generateFrameNumbers('knight_attack', { start: 0, end: 9 }), frameRate: 14, repeat: 0 })
    }
  }

  /* ── CHARACTER DRAWING ─────────────────────────── */
  _drawCharacter() {
    const x = this._knightX
    const y = this._charBaseY // = CHAR_Y = 530 (near ground)
    if (this.textures.exists('knight_idle') && this.textures.get('knight_idle').key !== '__MISSING') {
      const sprite = this.add.sprite(x, y, 'knight_idle', 0)
        .setOrigin(0.5, 1)
        .setDisplaySize(148, 178)  // larger — character is "close"
        .setDepth(20)
      sprite.play('knight_idle')
      sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'knight_attack', () => {
        sprite.play('knight_idle')
      })
      this._charGfx = sprite
    } else {
      const g = this.add.graphics().setPosition(x, y).setDepth(20)
      g.fillStyle(0x9999cc, 0.9); g.fillRoundedRect(-18, -70, 36, 70, 4)
      this._charGfx = g
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

    this.input.on('pointerdown', (p) => {
      this._isDragging    = true
      this._dragStartX    = p.x
      this._dragStartCamX = this.cameras.main.scrollX
    })
    this.input.on('pointermove', (p) => {
      if (!this._isDragging || Math.abs(p.x - this._dragStartX) < 6) return
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this._dragStartCamX + (this._dragStartX - p.x),
        0, PAN_MAX
      )
    })
    this.input.on('pointerup', () => { this._isDragging = false })
  }

  /* ── SOUNDS ─────────────────────────────────────── */
  _setupSounds() {
    this._muted = false
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

  /* ── PROJECTILE — castle-colored energy orb ─────── */
  _fireProjectile(castleId) {
    const castle = this.castleObjects[castleId]
    if (!castle) return
    const sx   = this._knightX
    const sy   = this._charBaseY - 75  // from character's chest
    const ex   = castle.wx
    const ey   = GY - 115
    const dist = Phaser.Math.Distance.Between(sx, sy, ex, ey)
    const dur  = Phaser.Math.Clamp(dist * 0.34, 150, 400)
    const arc  = dist * 0.18
    const castleCols = [0xff4d4d, 0x4db8ff, 0x4dff91, 0xffd94d]
    const cc = castleCols[castleId] || 0xff8800
    const gfx = this.add.graphics().setDepth(45)
    gfx.fillStyle(cc, 0.22); gfx.fillCircle(0, 0, 28)
    gfx.fillStyle(cc, 0.85); gfx.fillCircle(0, 0, 16)
    gfx.fillStyle(0xffffff, 0.92); gfx.fillCircle(0, 0, 7)
    gfx.fillStyle(cc, 0.50); gfx.fillCircle(-5, -6, 5)
    this.tweens.add({ targets: gfx, rotation: Math.PI * 6, duration: dur, ease: 'Linear' })
    gfx.setPosition(sx, sy)
    this._projectiles.push({ gfx, x0: sx, y0: sy, x1: ex, y1: ey, arc, dur, t: 0 })
    if (this._charGfx?.anims) {
      const cur = this._charGfx.anims.currentAnim?.key
      if (cur !== 'knight_attack') this._charGfx.play('knight_attack')
    } else {
      this.tweens.add({ targets: this._charGfx, alpha: 0.55, duration: 55, yoyo: true, repeat: 1 })
    }
  }

  _spawnImpact(x, y) {
    const f = this.add.graphics().setPosition(x, y).setDepth(60)
    f.fillStyle(0xff8800, 0.95); f.fillCircle(0, 0, 16)
    f.fillStyle(0xffcc00, 0.85); f.fillCircle(0, 0, 9)
    for (let i = 0; i < 6; i++) {
      const sx = Phaser.Math.Between(-20, 20)
      const sy2 = Phaser.Math.Between(-20, 20)
      f.fillStyle(0xffaa00, 0.82); f.fillCircle(sx, sy2, Phaser.Math.Between(2, 5))
    }
    this.tweens.add({ targets: f, alpha: 0, scaleX: 2.4, scaleY: 2.4, duration: 240, onComplete: () => f.destroy() })
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
