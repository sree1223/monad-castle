import Phaser from 'phaser'

const CASTLE_SCALE = 0.7   // visual scale of the castle sprite

const THEMES = [
  { banner: 0xcc2200, light: 0xff5533, name: 'Crimson' },
  { banner: 0x1155cc, light: 0x4488ff, name: 'Azure'   },
  { banner: 0x229922, light: 0x44cc44, name: 'Emerald' },
  { banner: 0xcc8800, light: 0xffcc00, name: 'Gold'    },
]
const COOLDOWN_SECS = 30   // 30-second capture cooldown (testnet demo)

export default class CastleObject {
  constructor(scene, wx, groundY, id, label = '') {
    this.scene = scene; this.wx = wx; this.groundY = groundY
    this.id = id; this.label = label
    this.maxHp = 1000; this.currentHp = 1000
    this.pool = 0; this.owner = null; this.roundId = 1
    this._clickCb = null; this._infoCb = null
    this._T = THEMES[id % THEMES.length]
    this._fallen = false; this._cooldownLeft = 0; this._cooldownTimer = null
    this._c = scene.add.container(wx, groundY).setDepth(10)  // above ground (depth 2) & trees (depth 3)
    this._drawCastle()
    this._createHPBar()
    this._createClickZone()
    this._createInfoBtn()
    this._c.setScale(CASTLE_SCALE)
    this.x = wx; this.y = groundY
  }

  _drawCastle() {
    const T = this._T, g = this.scene.add.graphics()
    const stone = 0xb8c4cc, stone2 = 0x8a9aa8, mortar = 0x556070
    // base shadow removed — mound provides ground context
    g.fillStyle(stone); g.fillRect(-54, -120, 108, 120)
    g.fillStyle(mortar, 0.22)
    for (let row = 0; row < 8; row++) {
      const off = (row % 2) * 16
      for (let col = -54; col < 54; col += 32) g.fillRect(col + off, -120 + row * 15, 30, 13)
    }
    g.fillStyle(stone2, 0.35); g.fillRect(22, -120, 32, 120)
    this._tower(g, -72, -148, 44, 150, T.banner, stone, stone2, mortar)
    this._tower(g, 28, -148, 44, 150, T.banner, stone, stone2, mortar)
    g.fillStyle(0x1a1208); g.fillRoundedRect(-24, -76, 48, 76, { tl: 24, tr: 24, bl: 0, br: 0 })
    g.fillStyle(0x2e1e0a, 0.5); g.fillRoundedRect(-22, -74, 44, 72, { tl: 22, tr: 22, bl: 0, br: 0 })
    g.lineStyle(2, 0x7a5a20, 0.9)
    for (let bi = 0; bi < 3; bi++) g.strokeRect(-14 + bi * 12, -72, 2.5, 70)
    for (let bj = 0; bj < 3; bj++) g.strokeRect(-14, -60 + bj * 22, 28, 2.5)
    g.fillStyle(0xd4af37); g.fillCircle(-18, -76, 4); g.fillCircle(18, -76, 4)
    g.fillStyle(stone)
    for (let bi = 0; bi < 7; bi++) g.fillRect(-52 + bi * 17, -136, 13, 16)
    const drawFlag = (fx, fy) => {
      g.fillStyle(0x9a9a9a); g.fillRect(fx, fy - 46, 4, 46)
      g.fillStyle(T.banner); g.fillTriangle(fx + 4, fy - 46, fx + 4, fy - 22, fx + 32, fy - 34)
      g.fillStyle(T.light, 0.4); g.fillRect(fx + 4, fy - 46, 28, 7)
    }
    drawFlag(-62, -148); drawFlag(28, -148)
    g.fillStyle(0xd4af37); g.fillRect(-2, -172, 4, 52)
    g.fillStyle(T.banner); g.fillTriangle(2, -172, 2, -142, 34, -157)
    g.fillStyle(0xffffff, 0.25); g.fillRect(2, -172, 32, 9)
    ;[[-52, -28], [52, -28]].forEach(([tx, ty]) => {
      const flame = this.scene.add.graphics()
      this.scene.time.addEvent({
        delay: 70 + Math.random() * 60, loop: true, callback: () => {
          flame.clear()
          flame.fillStyle(0x5a3010); flame.fillRect(tx - 2, ty, 4, 12)
          const r = Phaser.Math.FloatBetween(4, 7)
          flame.fillStyle(0xff8800, Phaser.Math.FloatBetween(0.7, 1.0)); flame.fillCircle(tx, ty - r - 3, r)
          flame.fillStyle(0xffee00, 0.7); flame.fillCircle(tx, ty - r - 5, r * 0.5)
        }
      })
      this._c.add(flame)
    })
    this._c.add(g); this._castleGfx = g
  }

  _tower(g, tx, ty, tw, th, banner, light, dark, mortar) {
    g.fillStyle(light); g.fillRect(tx, ty, tw, th)
    g.fillStyle(mortar, 0.2)
    for (let row = 0; row < 10; row++) {
      const off = (row % 2) * 14
      for (let col = tx; col < tx + tw; col += 28) g.fillRect(col + off, ty + row * 15, 26, 13)
    }
    g.fillStyle(dark, 0.3); g.fillRect(tx + tw - 12, ty, 12, th)
    g.fillStyle(light)
    for (let bi = 0; bi < 4; bi++) g.fillRect(tx + bi * 12, ty - 15, 9, 15)
    g.fillStyle(0x1a1208); g.fillRoundedRect(tx + tw / 2 - 6, ty + 32, 12, 26, { tl: 6, tr: 6, bl: 2, br: 2 })
    g.fillStyle(0xffd080, 0.5); g.fillCircle(tx + tw / 2, ty + 32, 9)
    g.fillStyle(banner, 0.35); g.fillRect(tx, ty, tw, 10)
  }

  _createHPBar() {
    const BW = 158, BH = 15, BY = -224
    // Panel background — bright cream with themed border
    const bg = this.scene.add.graphics()
    bg.fillStyle(0xF0F6FF, 0.97); bg.fillRoundedRect(-BW / 2 - 10, BY - 50, BW + 20, BH + 80, 9)
    bg.fillStyle(0xFFFFFF, 0.70); bg.fillRoundedRect(-BW / 2 - 10, BY - 50, BW + 20, 12, { tl: 9, tr: 9, bl: 0, br: 0 })
    bg.lineStyle(3, this._T.banner, 0.95); bg.strokeRoundedRect(-BW / 2 - 10, BY - 50, BW + 20, BH + 80, 9)
    this._c.add(bg)
    this._nameText = this.scene.add.text(0, BY - 38, this.label.toUpperCase(), {
      fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#' + this._T.banner.toString(16).padStart(6, '0'),
      stroke: '#ffffff', strokeThickness: 4,
    }).setOrigin(0.5)
    this._c.add(this._nameText)
    const ob = this.scene.add.graphics()
    ob.fillStyle(0xD8E8FF, 0.90); ob.fillRoundedRect(-BW / 2, BY - 19, BW, 19, 4)
    this._c.add(ob)
    this._ownerText = this.scene.add.text(0, BY - 9, '– no owner –', {
      fontSize: '11px', fontFamily: 'monospace', color: '#3a4c70', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5)
    this._c.add(this._ownerText)
    const trough = this.scene.add.graphics()
    trough.fillStyle(0xC0D4EE, 0.90); trough.fillRoundedRect(-BW / 2, BY, BW, BH, 4)
    this._c.add(trough)
    this._hpFill = this.scene.add.graphics()
    this._c.add(this._hpFill)
    this._hpText = this.scene.add.text(0, BY + 18, '1000/1000', {
      fontSize: '12px', fontFamily: 'monospace', color: '#1a2050', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5)
    this._c.add(this._hpText)
    this._BY = BY; this._BW = BW; this._BH = BH
    this._renderHP()
  }

  _renderHP() {
    const pct = Math.max(0, this.currentHp / this.maxHp)
    const fw = this._BW * pct
    const col = pct > 0.55 ? 0x22dd55 : pct > 0.3 ? 0xffaa00 : 0xff2222
    this._hpFill.clear()
    if (fw > 1) {
      this._hpFill.fillStyle(col, 1); this._hpFill.fillRoundedRect(-this._BW / 2, this._BY, fw, this._BH, 3)
      this._hpFill.fillStyle(0xffffff, 0.2); this._hpFill.fillRect(-this._BW / 2, this._BY, fw, this._BH / 2)
    }
    this._hpText?.setText(`${this.currentHp}/${this.maxHp}`)
  }

  _createClickZone() {
    // Hover glow ring — rendered in scene coords to avoid scaled-container jitter
    this._hoverGfx = this.scene.add.graphics().setDepth(8)
    const zone = this.scene.add.zone(0, -70, 152, 230).setInteractive({ cursor: 'pointer' })
    zone.on('pointerdown', (p) => { p.event?.stopPropagation?.(); if (!this._fallen) this._clickCb?.() })
    zone.on('pointerover', () => {
      if (this._fallen) return
      const S = CASTLE_SCALE
      this._hoverGfx.clear()
      this._hoverGfx.lineStyle(3, this._T.light, 0.55)
      this._hoverGfx.strokeRoundedRect(this.wx - 70*S, this.groundY - 190*S, 140*S, 195*S, 5)
      this._hoverGfx.lineStyle(1, 0xffffff, 0.15)
      this._hoverGfx.strokeRoundedRect(this.wx - 72*S, this.groundY - 192*S, 144*S, 199*S, 6)
    })
    zone.on('pointerout', () => this._hoverGfx.clear())
    this._c.add(zone)
  }

  _createInfoBtn() {
    const bx = 72, by = -222
    const ibg = this.scene.add.graphics()
    ibg.fillStyle(0xd4af37); ibg.fillCircle(bx, by, 12)
    ibg.fillStyle(0x1a1000); ibg.fillCircle(bx, by, 10)
    const it = this.scene.add.text(bx, by, 'i', { fontSize: '12px', fontFamily: 'serif', fontStyle: 'bold', color: '#d4af37' }).setOrigin(0.5)
    const iz = this.scene.add.zone(bx, by, 28, 28).setInteractive({ cursor: 'help' })
    iz.on('pointerdown', (p) => { p.event?.stopPropagation?.(); this._infoCb?.() })
    iz.on('pointerover', () => ibg.setAlpha(0.65)); iz.on('pointerout', () => ibg.setAlpha(1))
    this._c.add(ibg); this._c.add(it); this._c.add(iz)
  }

  setClickCallback(fn) { this._clickCb = fn }
  setInfoCallback(fn) { this._infoCb = fn }

  updateFromChain({ hp, pool, owner, roundId } = {}) {
    if (hp !== undefined) this.currentHp = Math.max(0, hp)
    if (pool !== undefined) this.pool = pool
    if (owner !== undefined) this.owner = owner
    if (roundId !== undefined) this.roundId = roundId
    this._renderHP()
    const short = this.owner ? `${this.owner.slice(0, 6)}…${this.owner.slice(-4)}` : '– no owner –'
    this._ownerText?.setText(short)
  }

  playAttackEffect() {
    const S = CASTLE_SCALE
    const origX = this._c.x
    this.scene.tweens.add({ targets: this._c, x: origX + 8, duration: 35, yoyo: true, repeat: 4, onComplete: () => this._c.setX(origX) })
    // Arrow impact burst
    const flash = this.scene.add.graphics().setPosition(this.wx, this.groundY - 90 * S).setDepth(55)
    flash.fillStyle(0xff6600, 0.9); flash.fillCircle(0, 0, 12)
    flash.fillStyle(0xffcc00, 0.8); flash.fillCircle(0, 0, 7)
    // Debris splinters
    for (let i = 0; i < 5; i++) {
      const sx = Phaser.Math.Between(-18, 18), sy = Phaser.Math.Between(-18, 18)
      flash.fillStyle(0xcc8800, 0.75); flash.fillRect(sx - 1, sy - 3, 2, 6)
    }
    this.scene.tweens.add({ targets: flash, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 280, onComplete: () => flash.destroy() })
    // Floating damage text
    const ox = Phaser.Math.Between(-20, 20)
    const dmg = this.scene.add.text(this.wx + ox, this.groundY - 100 * S, '−50 HP', {
      fontSize: '14px', fontFamily: '"Courier New", monospace', fontStyle: 'bold',
      color: '#ff4444', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(70)
    this.scene.tweens.add({ targets: dmg, y: dmg.y - 55, alpha: 0, duration: 850, ease: 'Power2', onComplete: () => dmg.destroy() })
  }

  playFallEffect(winner, cb) {
    this._fallen = true
    for (let i = 0; i < 7; i++) {
      const sm = this.scene.add.graphics().setPosition(
        this.wx + Phaser.Math.Between(-50, 50),
        this.groundY - Phaser.Math.Between(10, 120)
      ).setDepth(58)
      sm.fillStyle(0x888888, 0.65); sm.fillCircle(0, 0, Phaser.Math.Between(8, 18))
      this.scene.tweens.add({ targets: sm, y: sm.y - 100, alpha: 0, scaleX: 2.2, scaleY: 2.2, duration: 900 + i * 100, delay: i * 80, onComplete: () => sm.destroy() })
    }
    this.scene.tweens.add({
      targets: this._c, y: this.groundY + 160, alpha: 0.05, angle: Phaser.Math.Between(-18, 18),
      duration: 700, ease: 'Power2',
      onComplete: () => {
        this._c.setVisible(false)
        const banner = this.scene.add.text(this.wx, this.groundY - 110, '🏰 CAPTURED!', {
          fontSize: '28px', fontFamily: 'serif', fontStyle: 'bold', color: '#ffd700',
          stroke: '#7700aa', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(100)
        this.scene.tweens.add({ targets: banner, y: banner.y - 50, duration: 450 })
        if (winner) {
          const wt = this.scene.add.text(this.wx, this.groundY - 52,
            `👑 ${winner.length > 12 ? winner.slice(0, 6) + '…' + winner.slice(-4) : winner}`, {
            fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold',
            color: '#ffe066', stroke: '#000', strokeThickness: 5,
          }).setOrigin(0.5).setDepth(101)
          this.scene.time.delayedCall(4200, () => {
            this.scene.tweens.add({ targets: wt, alpha: 0, duration: 500, onComplete: () => wt.destroy() })
          })
        }
        this.scene.time.delayedCall(2200, () => {
          this.scene.tweens.add({ targets: banner, alpha: 0, duration: 400, onComplete: () => banner.destroy() })
        })
        cb?.()
        this._startCooldown(COOLDOWN_SECS, winner)
      }
    })
  }

  _startCooldown(secs, winner) {
    this._cooldownLeft = secs; this._cooldownTimer?.remove()
    this._captureOwner = winner || null
    this._cdGfx = this.scene.add.graphics().setPosition(this.wx, this.groundY).setDepth(62)
    const shortName = winner
      ? (winner.length > 12 ? winner.slice(0, 6) + '…' + winner.slice(-4) : winner)
      : '???'
    this._cdText = this.scene.add.text(this.wx, this.groundY - 88, '', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffe066', stroke: '#330066', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setDepth(63)
    const update = () => {
      const m = Math.floor(this._cooldownLeft / 60), s = this._cooldownLeft % 60
      this._cdText.setText(`🏰 Captured by\n${shortName}\n⏱ ${m}:${String(s).padStart(2, '0')}`)
      this._cdGfx.clear()
      // Panel background
      this._cdGfx.fillStyle(0x33006a, 0.92); this._cdGfx.fillRoundedRect(-66, -72, 132, 62, 8)
      this._cdGfx.lineStyle(2, 0xffd700, 0.7); this._cdGfx.strokeRoundedRect(-66, -72, 132, 62, 8)
      // Countdown bar bg
      this._cdGfx.fillStyle(0x110022, 0.9); this._cdGfx.fillRoundedRect(-58, -14, 116, 12, 5)
      // Countdown bar fill (gold, drains as time passes)
      const pct = this._cooldownLeft / COOLDOWN_SECS
      this._cdGfx.fillStyle(0xffd700, 0.95); this._cdGfx.fillRoundedRect(-58, -14, Math.round(116 * pct), 12, 5)
      this._cdGfx.fillStyle(0xffffff, 0.25); this._cdGfx.fillRoundedRect(-58, -14, Math.round(116 * pct), 4, 3)
    }
    update()
    this._cooldownTimer = this.scene.time.addEvent({
      delay: 1000, loop: true, callback: () => {
        this._cooldownLeft--
        if (this._cooldownLeft <= 0) { this._cooldownTimer.remove(); this._rebuild() }
        else update()
      }
    })
  }

  _rebuild() {
    this._cdGfx?.destroy(); this._cdText?.destroy()
    this._fallen = false; this.currentHp = this.maxHp
    this._renderHP(); this._ownerText?.setText('– no owner –')
    this._c.setVisible(true); this._c.setAlpha(0); this._c.setAngle(0); this._c.setY(this.groundY)
    this.scene.tweens.add({ targets: this._c, alpha: 1, duration: 700, ease: 'Quad.Out' })
    const rt = this.scene.add.text(this.wx, this.groundY - 150, '🏰 LIBERATED!\nOpen for attack!', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#44ff88', stroke: '#000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setDepth(102)
    this.scene.tweens.add({ targets: rt, y: rt.y - 40, duration: 500 })
    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({ targets: rt, alpha: 0, duration: 500, onComplete: () => rt.destroy() })
    })
  }
}
