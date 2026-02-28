/**
 * CharacterData.js — 6 anime-inspired original warrior classes
 * Phaser Graphics: (0,0) = feet, character extends UPWARD (negative y)
 * Each character is ~90px tall from feet to top
 */

export const CHARACTERS = [
  {
    id: 'sage',
    name: 'Spike Sage',
    title: 'Leaf Wind',
    desc: 'Speed that breaks the sound barrier. Shadow clones confound every fortress.',
    color: '#ff8c00',
    accent: '#5599ff',
    attackStyle: 'shuriken',
    lore: 'Trained by the mountain frogs, mastered all five jutsu elements.',
    draw: drawSpikeSage,
  },
  {
    id: 'brawler',
    name: 'Gum Brawler',
    title: 'Straw King',
    desc: 'Stretches across the battlefield and hits like a cannon made of rubber.',
    color: '#e83030',
    accent: '#f5d020',
    attackStyle: 'cannon',
    lore: 'Ate the cursed rubber fruit. Nothing can pierce this pirate king\'s iron will.',
    draw: drawGumBrawler,
  },
  {
    id: 'reaper',
    name: 'Soul Reaper',
    title: 'Black Blade',
    desc: 'One swing collapses entire battlements. Hollow energy erases stone.',
    color: '#c0c0e0',
    accent: '#ff6622',
    attackStyle: 'slash',
    lore: 'Vizard hybrid. Neither living nor dead — simply unstoppable.',
    draw: drawSoulReaper,
  },
  {
    id: 'hunter',
    name: 'Titan Hunter',
    title: 'Survey Wing',
    desc: 'Precision strikes with ODM blades — zeroes in on vulnerable spots every time.',
    color: '#4a8a4a',
    accent: '#d4b870',
    attackStyle: 'axe',
    lore: 'Last of the Scout Regiment. Humanity\'s strongest survives every wall.',
    draw: drawTitanHunter,
  },
  {
    id: 'slayer',
    name: 'Ember Slayer',
    title: 'Flame Breath',
    desc: 'Total Concentration breathing unleashes a thousand cuts per second.',
    color: '#22aa88',
    accent: '#ff4422',
    attackStyle: 'magic',
    lore: 'Descended from Breath of the Sun users. Checkered haori never burns.',
    draw: drawEmberSlayer,
  },
  {
    id: 'hero',
    name: 'Plus Ultra',
    title: 'Symbol of Victory',
    desc: 'One For All full power — 100% output devastates any castle wall.',
    color: '#44aa44',
    accent: '#55aaff',
    attackStyle: 'shield-bash',
    lore: 'Quirkless no more. OFA lightning turns limitations into legend.',
    draw: drawPlusUltra,
  },
]

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0]
}

/* ═══════════════════════════════ SPIKE SAGE — Naruto Uzumaki (anime outline art) ═══════════════ */
function drawSpikeSage(g) {
  // Coordinate system: (0,0) = feet, extends NEGATIVE-Y (upward).
  // Every shape is filled then immediately stroked for crisp black anime line-art.

  // ── ground shadow ──────────────────────────────────────────────────────────────────────────────
  g.fillStyle(0x000000, 0.18); g.fillEllipse(0, -4, 54, 10)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SANDALS ━━
  // LEFT sandal sole
  g.fillStyle(0x2d1800); g.fillRoundedRect(-15, -18, 13, 18, 3)
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(-15, -18, 13, 18, 3)
  // left strap
  g.fillStyle(0x4a2a00); g.fillRect(-15, -10, 13, 3)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRect(-15, -10, 13, 3)
  // RIGHT sandal sole
  g.fillStyle(0x2d1800); g.fillRoundedRect(2, -18, 13, 18, 3)
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(2, -18, 13, 18, 3)
  // right strap
  g.fillStyle(0x4a2a00); g.fillRect(2, -10, 13, 3)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRect(2, -10, 13, 3)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ORANGE PANTS ━━
  // left leg
  g.fillStyle(0xff7200); g.fillRect(-15, -52, 13, 34)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(-15, -52, 13, 34)
  g.fillStyle(0xcc5200, 0.55); g.fillRect(-7, -52, 7, 34)           // right-side leg shadow
  g.fillStyle(0xcc5200); g.fillRect(-15, -52, 13, 5)                // waistband top
  // right leg
  g.fillStyle(0xff7200); g.fillRect(2, -52, 13, 34)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(2, -52, 13, 34)
  g.fillStyle(0xcc5200, 0.55); g.fillRect(8, -52, 7, 34)
  g.fillStyle(0xcc5200); g.fillRect(2, -52, 13, 5)
  // knee crease lines
  g.lineStyle(1.5, 0xcc5200, 0.9)
  g.lineBetween(-15, -35, -2, -35); g.lineBetween(2, -35, 15, -35)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ JACKET BODY ━━
  // main orange jacket
  g.fillStyle(0xff7200); g.fillRoundedRect(-17, -96, 34, 46, 5)
  g.lineStyle(2.5, 0x000000, 1); g.strokeRoundedRect(-17, -96, 34, 46, 5)
  // depth shading
  g.fillStyle(0xcc5200, 0.5); g.fillRect(5, -96, 12, 46)            // right-side shadow
  g.fillStyle(0xff9a30, 0.35); g.fillRect(-17, -96, 7, 46)          // left highlight
  // black collar
  g.fillStyle(0x111111); g.fillRect(-17, -96, 34, 8)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRect(-17, -96, 34, 8)
  g.fillStyle(0x333333, 0.6); g.fillRect(-17, -93, 34, 3)           // collar inner fold
  // black centre-zipper stripe
  g.fillStyle(0x111111); g.fillRect(-4, -96, 8, 46)
  // white undershirt gap in collar
  g.fillStyle(0xfcfcfc); g.fillRect(-3, -92, 6, 18)
  g.lineStyle(1, 0xcccccc, 1); g.strokeRect(-3, -92, 6, 18)
  // waist seam
  g.lineStyle(1.5, 0xcc5200, 0.8)
  g.lineBetween(-17, -60, -4, -60); g.lineBetween(4, -60, 17, -60)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ARMS ━━
  // LEFT arm sleeve
  g.fillStyle(0xff7200); g.fillRect(-30, -92, 13, 34)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(-30, -92, 13, 34)
  g.fillStyle(0xcc5200, 0.4); g.fillRect(-23, -92, 6, 34)           // arm shadow
  // left hand
  g.fillStyle(0xf4c98a); g.fillRoundedRect(-32, -62, 15, 13, 4)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRoundedRect(-32, -62, 15, 13, 4)
  // knuckle lines on hand
  g.lineStyle(1, 0xd4a060, 1)
  g.lineBetween(-32, -57, -17, -57); g.lineBetween(-32, -54, -17, -54)

  // RASENGAN swirling ball of chakra in left palm
  g.fillStyle(0x0055cc, 0.15); g.fillCircle(-25, -48, 16)           // outermost aura
  g.fillStyle(0x0088ff, 0.30); g.fillCircle(-25, -48, 12)           // outer glow
  g.fillStyle(0x22aaff, 0.55); g.fillCircle(-25, -48, 8)            // mid glow
  g.fillStyle(0x66ccff, 0.80); g.fillCircle(-25, -48, 5)            // inner bright
  g.fillStyle(0xaaddff, 0.95); g.fillCircle(-25, -48, 3)            // near-core
  g.fillStyle(0xffffff,  1.0); g.fillCircle(-25, -48, 1.5)          // white-hot centre
  // rotation spiral
  g.lineStyle(1.5, 0x44aaff, 0.7)
  g.lineBetween(-38, -48, -12, -48)
  g.lineBetween(-25, -61, -25, -35)
  g.lineStyle(1, 0x88ccff, 0.5)
  g.lineBetween(-36, -54, -14, -42); g.lineBetween(-36, -42, -14, -54)

  // RIGHT arm raised (fist ready to strike)
  g.fillStyle(0xff7200); g.fillRect(17, -94, 13, 30)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(17, -94, 13, 30)
  g.fillStyle(0xcc5200, 0.4); g.fillRect(24, -94, 6, 30)
  // closed fist
  g.fillStyle(0xf4c98a); g.fillRoundedRect(17, -96, 15, 14, 4)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRoundedRect(17, -96, 15, 14, 4)
  // knuckles
  g.lineStyle(1, 0xd4a060, 1)
  g.lineBetween(17, -91, 32, -91); g.lineBetween(17, -88, 32, -88); g.lineBetween(17, -85, 32, -85)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ POUCH + KUNAI ━━
  g.fillStyle(0x3a2200); g.fillRoundedRect(8, -54, 12, 10, 2)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRoundedRect(8, -54, 12, 10, 2)
  g.lineStyle(1, 0x5a3800, 1); g.lineBetween(8, -50, 20, -50)
  // kunai handle sticking out
  g.fillStyle(0x555555); g.fillRect(12, -63, 4, 11)
  g.lineStyle(1, 0x222222, 1); g.strokeRect(12, -63, 4, 11)
  g.fillStyle(0xaaaaaa, 0.8); g.fillRect(13, -62, 1.5, 9)            // blade shine

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ NECK ━━
  g.fillStyle(0xf4c98a); g.fillRect(-5, -100, 10, 6)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRect(-5, -100, 10, 6)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HEAD / FACE ━━
  // main face shape
  g.fillStyle(0xf4c98a); g.fillRoundedRect(-16, -142, 32, 44, 14)
  g.lineStyle(2.5, 0x000000, 1); g.strokeRoundedRect(-16, -142, 32, 44, 14)
  // chin extension (soft lower jaw)
  g.fillStyle(0xf4c98a); g.fillEllipse(0, -100, 22, 9)
  // forehead highlight
  g.fillStyle(0xffe0b0, 0.22); g.fillEllipse(0, -136, 18, 8)
  // temple + cheek shading
  g.fillStyle(0xd4a060, 0.22); g.fillEllipse(-14, -122, 9, 22)
  g.fillStyle(0xd4a060, 0.22); g.fillEllipse(14, -122, 9, 22)
  // cheek blush circles (Naruto always looks excited)
  g.fillStyle(0xffaaaa, 0.32); g.fillCircle(-10, -116, 6)
  g.fillStyle(0xffaaaa, 0.32); g.fillCircle(10,  -116, 6)

  // ── Sage Mode eye markings (burnt-orange pigment rings — Naruto's sage form) ──
  g.fillStyle(0xdd5500, 0.90); g.fillEllipse(-6, -124, 20, 13)
  g.fillStyle(0xdd5500, 0.90); g.fillEllipse(7, -124, 20, 13)
  g.lineStyle(2, 0x993300, 0.85)
  g.strokeEllipse(-6, -124, 20, 13); g.strokeEllipse(7, -124, 20, 13)
  // lower eyelid pigment drip lines
  g.lineStyle(2.5, 0xbb4400, 0.85)
  g.lineBetween(-14, -119, -0.5, -119); g.lineBetween(1, -119, 14, -119)

  // ── EYES  (white sclera → blue iris → dark pupil → shine dots) ──────────────
  // LEFT eye — sclera (white)
  g.fillStyle(0xfcfcfc); g.fillEllipse(-6, -124, 14, 11)
  g.lineStyle(2.5, 0x000000, 1); g.strokeEllipse(-6, -124, 14, 11)
  // iris (bright cerulean blue)
  g.fillStyle(0x1a77dd); g.fillCircle(-6, -124, 5)
  g.fillStyle(0x1a55aa); g.fillCircle(-6, -124, 3)                   // darker inner iris
  // pupil
  g.fillStyle(0x001133); g.fillCircle(-6, -124, 1.8)
  // shines (anime triple-highlight pattern)
  g.fillStyle(0xffffff); g.fillEllipse(-3.5, -127, 5, 3.5)           // big upper-right shine
  g.fillStyle(0xffffff, 0.75); g.fillCircle(-8.5, -121.5, 1.5)       // small lower-left
  g.fillStyle(0xffffff, 0.5);  g.fillCircle(-4.5, -121, 1)           // tiny bottom accent
  // upper eyelid thick line + lashes
  g.lineStyle(3, 0x000000, 1)
  g.lineBetween(-13, -127, -0.5, -127)
  g.lineStyle(2, 0x000000, 1)
  g.lineBetween(-13, -127, -14, -130); g.lineBetween(-9, -127, -10, -130); g.lineBetween(-5, -127, -6, -130)

  // RIGHT eye — sclera
  g.fillStyle(0xfcfcfc); g.fillEllipse(7, -124, 14, 11)
  g.lineStyle(2.5, 0x000000, 1); g.strokeEllipse(7, -124, 14, 11)
  // iris
  g.fillStyle(0x1a77dd); g.fillCircle(7, -124, 5)
  g.fillStyle(0x1a55aa); g.fillCircle(7, -124, 3)
  // pupil
  g.fillStyle(0x001133); g.fillCircle(7, -124, 1.8)
  // shines
  g.fillStyle(0xffffff); g.fillEllipse(9.5, -127, 5, 3.5)
  g.fillStyle(0xffffff, 0.75); g.fillCircle(4.5, -121.5, 1.5)
  g.fillStyle(0xffffff, 0.5);  g.fillCircle(8.5, -121, 1)
  // eyelid + lashes
  g.lineStyle(3, 0x000000, 1)
  g.lineBetween(0.5, -127, 14, -127)
  g.lineStyle(2, 0x000000, 1)
  g.lineBetween(1, -127, 0, -130); g.lineBetween(5, -127, 4, -130); g.lineBetween(9, -127, 8, -130)

  // ── EYEBROWS (v-shaped, upward slant = excited/determined) ──────────────────
  g.fillStyle(0xcc8800)
  g.fillPoints([{x:-14,y:-132},{x:-4,y:-131},{x:-3,y:-129},{x:-13,y:-130}], true)  // left brow
  g.fillPoints([{x:3,y:-131},{x:13,y:-132},{x:14,y:-130},{x:4,y:-129}], true)      // right brow
  g.lineStyle(1.5, 0x000000, 1)
  g.strokePoints([{x:-14,y:-132},{x:-4,y:-131},{x:-3,y:-129},{x:-13,y:-130}], true)
  g.strokePoints([{x:3,y:-131},{x:13,y:-132},{x:14,y:-130},{x:4,y:-129}], true)

  // ── NOSE (anime minimal — just base shadow line) ─────────────────────────────
  g.lineStyle(1.5, 0xd4a060, 0.75)
  g.lineBetween(-3, -115, -3, -113); g.lineBetween(3, -115, 3, -113)
  g.lineBetween(-3, -113, 3, -113)

  // ── WIDE EXCITED GRIN ────────────────────────────────────────────────────────
  // upper lip
  g.fillStyle(0xd4a060); g.fillRoundedRect(-9, -112, 18, 3, 2)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRoundedRect(-9, -112, 18, 3, 2)
  // mouth cavity
  g.fillStyle(0x220000); g.fillRoundedRect(-8, -111, 16, 9, 3)
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(-8, -111, 16, 9, 3)
  // teeth (bright white top row)
  g.fillStyle(0xfcfcfc); g.fillRect(-7, -111, 14, 4.5)
  // tooth gap separators
  g.lineStyle(1, 0xbbbbbb, 0.9)
  g.lineBetween(-3.5, -111, -3.5, -106); g.lineBetween(0.5, -111, 0.5, -106); g.lineBetween(4.5, -111, 4.5, -106)
  // lower lip
  g.fillStyle(0xd4a060); g.fillRect(-8, -103, 16, 2)
  g.lineStyle(1, 0x000000, 0.5); g.strokeRect(-8, -103, 16, 2)

  // ── WHISKER MARKS — 3 per cheek (Naruto's most iconic feature) ───────────────
  g.lineStyle(2.5, 0x884400, 1.0)
  // left cheek — fanning outward from nose
  g.lineBetween(-16, -126, -7, -124)
  g.lineBetween(-16, -122, -7, -121)
  g.lineBetween(-16, -118, -7, -119)
  // right cheek
  g.lineBetween(7, -124, 16, -126)
  g.lineBetween(7, -121, 16, -122)
  g.lineBetween(7, -119, 16, -118)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HEADBAND ━━
  // blue cloth
  g.fillStyle(0x2255cc); g.fillRect(-17, -144, 34, 8)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(-17, -144, 34, 8)
  g.fillStyle(0x4477dd, 0.45); g.fillRect(-17, -144, 34, 3)           // cloth fold highlight
  // silver metal plate
  g.fillStyle(0xdddddd); g.fillRoundedRect(-11, -146, 22, 10, 2)
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(-11, -146, 22, 10, 2)
  g.fillStyle(0xfafafa, 0.6); g.fillRect(-11, -146, 22, 3)            // plate top shine
  g.fillStyle(0xbbbbbb); g.fillRect(-11, -143, 22, 1.5)               // plate centre ridge
  // Leaf village symbol (circle + spire + bar — simplified but unmistakable)
  g.fillStyle(0x667766); g.fillCircle(0, -141, 4)
  g.fillStyle(0xdddddd); g.fillCircle(0, -141, 2)                     // ring hollow
  g.fillStyle(0x667766); g.fillCircle(0, -141, 0.8)                   // centre dot
  g.fillStyle(0x667766); g.fillTriangle(-3, -141, 0, -147, 3, -141)   // top spire
  g.lineStyle(1.5, 0x445544, 1); g.lineBetween(-6, -142, 6, -142)     // horizontal crossbar

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SPIKY YELLOW HAIR ━━
  // BACK layer — darker golden yellow (spikes behind head)
  g.fillStyle(0xddaa00)
  g.fillPoints([{x:-17,y:-141},{x:-32,y:-172},{x:-17,y:-146},{x:-9,y:-144}], true)   // far-left back spike
  g.fillPoints([{x:-7,y:-143},{x:-18,y:-178},{x:-1,y:-145}], true)                   // centre-left back spike
  g.fillPoints([{x:0,y:-143},{x:-8,y:-176},{x:8,y:-145}], true)                      // centre back spike (tallest)
  g.fillPoints([{x:9,y:-142},{x:5,y:-166},{x:17,y:-143}], true)                      // right back spike
  // subtle outlines on back spikes
  g.lineStyle(1.5, 0x000000, 0.35)
  g.strokePoints([{x:-17,y:-141},{x:-32,y:-172},{x:-9,y:-144}], false)
  g.strokePoints([{x:-7,y:-143},{x:-18,y:-178},{x:-1,y:-145}], false)
  g.strokePoints([{x:0,y:-143},{x:-8,y:-176},{x:8,y:-145}], false)
  g.strokePoints([{x:9,y:-142},{x:5,y:-166},{x:17,y:-143}], false)

  // FRONT layer — bright yellow (main visible spikes)
  g.fillStyle(0xffdd00)
  g.fillPoints([{x:-17,y:-141},{x:-26,y:-163},{x:-10,y:-143}], true)  // front-left spike
  g.fillPoints([{x:-8,y:-143},{x:-13,y:-165},{x:1,y:-144}], true)     // front L-centre
  g.fillPoints([{x:-1,y:-143},{x:-5,y:-168},{x:6,y:-144}], true)      // front centre (tallest)
  g.fillPoints([{x:5,y:-143},{x:4,y:-161},{x:13,y:-143}], true)       // front R-centre
  g.fillPoints([{x:12,y:-142},{x:14,y:-157},{x:20,y:-142}], true)     // front-right spike
  // side temple sideburns
  g.fillStyle(0xffdd00)
  g.fillPoints([{x:-25,y:-142},{x:-22,y:-158},{x:-17,y:-142}], true)  // left sideburn spike
  g.fillPoints([{x:17,y:-142},{x:21,y:-156},{x:24,y:-142}], true)     // right sideburn spike

  // HIGHLIGHT wisps — lighter yellow on top
  g.fillStyle(0xffee66)
  g.fillPoints([{x:-10,y:-142},{x:-14,y:-155},{x:-4,y:-144}], true)
  g.fillPoints([{x:-1,y:-143},{x:-3,y:-154},{x:6,y:-144}], true)

  // black outlines on all front spikes (anime line-art)
  g.lineStyle(2, 0x000000, 1)
  g.strokePoints([{x:-17,y:-141},{x:-26,y:-163},{x:-10,y:-143}], true)
  g.strokePoints([{x:-8,y:-143},{x:-13,y:-165},{x:1,y:-144}], true)
  g.strokePoints([{x:-1,y:-143},{x:-5,y:-168},{x:6,y:-144}], true)
  g.strokePoints([{x:5,y:-143},{x:4,y:-161},{x:13,y:-143}], true)
  g.strokePoints([{x:12,y:-142},{x:14,y:-157},{x:20,y:-142}], true)
  g.lineStyle(2, 0x000000, 0.9)
  g.strokePoints([{x:-25,y:-142},{x:-22,y:-158},{x:-17,y:-142}], true)
  g.strokePoints([{x:17,y:-142},{x:21,y:-156},{x:24,y:-142}], true)
}

/* ═══════════════════════════════ GUM BRAWLER — Monkey D. Luffy (anime outline art) ═══════════════ */
function drawGumBrawler(g) {
  // ── ground shadow ──────────────────────────────────────────────────────────────────────────────
  g.fillStyle(0x000000, 0.18); g.fillEllipse(0, -4, 54, 10)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SANDALS ━━
  g.fillStyle(0x1a0a00); g.fillRoundedRect(-14, -16, 12, 16, 3)
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(-14, -16, 12, 16, 3)
  g.fillStyle(0x3a1800); g.fillRect(-14, -9, 12, 3)                    // left strap
  g.lineStyle(1.5, 0x000000, 1); g.strokeRect(-14, -9, 12, 3)
  g.fillStyle(0x1a0a00); g.fillRoundedRect(2, -16, 12, 16, 3)
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(2, -16, 12, 16, 3)
  g.fillStyle(0x3a1800); g.fillRect(2, -9, 12, 3)                      // right strap
  g.lineStyle(1.5, 0x000000, 1); g.strokeRect(2, -9, 12, 3)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ BLUE SHORTS ━━
  g.fillStyle(0x2244cc); g.fillRect(-15, -50, 30, 34)
  g.lineStyle(2.5, 0x000000, 1); g.strokeRect(-15, -50, 30, 34)
  // depth shading
  g.fillStyle(0x1a3399, 0.5); g.fillRect(5, -50, 10, 34)
  g.fillStyle(0x4466dd, 0.35); g.fillRect(-15, -50, 8, 34)
  // waistband strip
  g.fillStyle(0x1a3399); g.fillRect(-15, -50, 30, 5)
  g.lineStyle(1, 0x000000, 1); g.strokeRect(-15, -50, 30, 5)
  // short crease line (center)
  g.lineStyle(1.5, 0x1a3399, 0.8); g.lineBetween(0, -50, 0, -16)
  // BELT
  g.fillStyle(0x5a3208); g.fillRect(-16, -54, 32, 7)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(-16, -54, 32, 7)
  // gold buckle
  g.fillStyle(0xd4af37); g.fillRoundedRect(-5, -54, 10, 7, 2)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRoundedRect(-5, -54, 10, 7, 2)
  g.fillStyle(0xb8960a); g.fillRect(-3, -53, 6, 5)                     // buckle inner
  g.fillStyle(0xffe066, 0.5); g.fillRect(-3, -53, 6, 2)                // buckle shine

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RED VEST ━━
  // LEFT vest panel
  g.fillStyle(0xcc1111); g.fillRoundedRect(-18, -92, 15, 42, {tl:3,tr:0,bl:3,br:0})
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(-18, -92, 15, 42, {tl:3,tr:0,bl:3,br:0})
  g.fillStyle(0xee3333, 0.4); g.fillRect(-18, -92, 7, 42)              // highlight left-side
  g.fillStyle(0x991111, 0.5); g.fillRect(-6, -92, 3, 42)              // shadow right-edge
  // RIGHT vest panel
  g.fillStyle(0xcc1111); g.fillRoundedRect(3, -92, 15, 42, {tl:0,tr:3,bl:0,br:3})
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(3, -92, 15, 42, {tl:0,tr:3,bl:0,br:3})
  g.fillStyle(0xee3333, 0.4); g.fillRect(3, -92, 7, 42)
  g.fillStyle(0x991111, 0.5); g.fillRect(14, -92, 4, 42)
  // CHEST skin (open vest shows bare chest)
  g.fillStyle(0xf4c98a); g.fillRect(-4, -92, 8, 42)
  g.fillStyle(0xd4a060, 0.4); g.fillRect(-1, -78, 2, 24)              // sternum line

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ARMS ━━
  // RIGHT arm (relaxed at side)
  g.fillStyle(0xf4c98a); g.fillRect(18, -88, 12, 34)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(18, -88, 12, 34)
  g.fillStyle(0xd4a060, 0.4); g.fillRect(24, -88, 6, 34)
  // right hand relaxed
  g.fillStyle(0xf4c98a); g.fillRoundedRect(18, -58, 13, 11, 3)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRoundedRect(18, -58, 13, 11, 3)

  // LEFT arm — STRETCHED (Luffy's rubber Devil Fruit power!)
  // elongated arm stretched far to the left
  g.fillStyle(0xf4c98a); g.fillRect(-56, -76, 38, 13)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(-56, -76, 38, 13)
  g.fillStyle(0xd4a060, 0.4); g.fillRect(-56, -76, 38, 4)             // arm top shading
  // rubber "stretch" wrinkle lines on extended arm
  g.lineStyle(1, 0xd4a060, 0.7)
  g.lineBetween(-50, -76, -50, -63); g.lineBetween(-44, -76, -44, -63)
  g.lineBetween(-38, -76, -38, -63); g.lineBetween(-32, -76, -32, -63)
  g.lineBetween(-26, -76, -26, -63); g.lineBetween(-20, -76, -20, -63)
  // FIST — closed, extended
  g.fillStyle(0xf4c98a); g.fillRoundedRect(-66, -84, 18, 20, 5)
  g.lineStyle(2.5, 0x000000, 1); g.strokeRoundedRect(-66, -84, 18, 20, 5)
  // knuckle ridge on fist
  g.fillStyle(0xd4a060); g.fillRect(-66, -80, 18, 4)
  g.lineStyle(1, 0xd4a060, 0.8)
  g.lineBetween(-66, -76, -48, -76); g.lineBetween(-66, -72, -48, -72)
  // IMPACT FLASH (star-burst around fist = hit effect)
  g.fillStyle(0xffffff, 0.85); g.fillTriangle(-78, -80, -66, -84, -72, -96)  // top-left spike
  g.fillStyle(0xffff00, 0.80); g.fillTriangle(-80, -72, -66, -76, -76, -64)  // left spike
  g.fillStyle(0xffffff, 0.70); g.fillTriangle(-74, -92, -66, -84, -60, -94)  // top spike
  g.fillStyle(0xffdd00, 0.60); g.fillTriangle(-76, -61, -66, -64, -74, -56)  // bottom-left spark
  // impact outline
  g.lineStyle(1.5, 0xcc8800, 0.7)
  g.strokePoints([{x:-78,y:-80},{x:-66,y:-84},{x:-72,y:-96}], true)
  g.strokePoints([{x:-80,y:-72},{x:-66,y:-76},{x:-76,y:-64}], true)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ NECK ━━
  g.fillStyle(0xf4c98a); g.fillRect(-5, -96, 10, 6)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRect(-5, -96, 10, 6)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HEAD ━━
  // face shape — Luffy has a wider jaw + roundish anime face
  g.fillStyle(0xf4c98a); g.fillRoundedRect(-16, -134, 32, 40, 14)
  g.lineStyle(2.5, 0x000000, 1); g.strokeRoundedRect(-16, -134, 32, 40, 14)
  // chin ellipse extension
  g.fillStyle(0xf4c98a); g.fillEllipse(0, -96, 22, 8)
  // forehead highlight
  g.fillStyle(0xffe0b0, 0.20); g.fillEllipse(0, -128, 20, 8)
  // cheek shading
  g.fillStyle(0xd4a060, 0.20); g.fillEllipse(-14, -116, 9, 22)
  g.fillStyle(0xd4a060, 0.20); g.fillEllipse(14, -116, 9, 22)
  // Luffy's big rosy cheeks (excited expression)
  g.fillStyle(0xffaaaa, 0.38); g.fillCircle(-10, -110, 7)
  g.fillStyle(0xffaaaa, 0.38); g.fillCircle(10,  -110, 7)

  // ── EYES — huge round black anime eyes ──────────────────────────────────────
  // left eye large circle (white sclera)
  g.fillStyle(0xfcfcfc); g.fillEllipse(-6, -118, 16, 14)
  g.lineStyle(2.5, 0x000000, 1); g.strokeEllipse(-6, -118, 16, 14)
  // left iris (pure black — Luffy has simple manga-style eyes)
  g.fillStyle(0x111111); g.fillCircle(-6, -118, 6)
  // left shines (two dots = manga standard)
  g.fillStyle(0xffffff); g.fillEllipse(-3, -122, 6, 4)               // main upper shine
  g.fillStyle(0xffffff, 0.75); g.fillCircle(-9, -114, 2)              // lower sub-shine
  // upper eyelid line + lashes
  g.lineStyle(3, 0x000000, 1)
  g.lineBetween(-14, -122, 1, -122)
  g.lineStyle(2, 0x000000, 1)
  g.lineBetween(-14, -122, -15, -125); g.lineBetween(-10, -122, -11, -125); g.lineBetween(-6, -122, -7, -125)

  // right eye
  g.fillStyle(0xfcfcfc); g.fillEllipse(7, -118, 16, 14)
  g.lineStyle(2.5, 0x000000, 1); g.strokeEllipse(7, -118, 16, 14)
  g.fillStyle(0x111111); g.fillCircle(7, -118, 6)
  g.fillStyle(0xffffff); g.fillEllipse(10, -122, 6, 4)
  g.fillStyle(0xffffff, 0.75); g.fillCircle(4, -114, 2)
  g.lineStyle(3, 0x000000, 1)
  g.lineBetween(0, -122, 15, -122)
  g.lineStyle(2, 0x000000, 1)
  g.lineBetween(1, -122, 0, -125); g.lineBetween(5, -122, 4, -125); g.lineBetween(9, -122, 8, -125)

  // ── EYEBROWS — thick arched upward (happy excited look) ─────────────────────
  g.fillStyle(0x111111)
  g.fillPoints([{x:-14,y:-126},{x:-5,y:-125},{x:-4,y:-123},{x:-13,y:-124}], true)  // left brow
  g.fillPoints([{x:4,y:-125},{x:13,y:-126},{x:14,y:-124},{x:5,y:-123}], true)      // right brow
  g.lineStyle(1.5, 0x000000, 1)
  g.strokePoints([{x:-14,y:-126},{x:-5,y:-125},{x:-4,y:-123},{x:-13,y:-124}], true)
  g.strokePoints([{x:4,y:-125},{x:13,y:-126},{x:14,y:-124},{x:5,y:-123}], true)

  // ── SCAR (two diagonal cuts under left eye — Luffy's defining scar) ──────────
  g.lineStyle(2, 0xaa4444, 0.90)
  g.lineBetween(-12, -113, -8, -107)                                   // main scar cut
  g.lineStyle(1.5, 0xaa4444, 0.65)
  g.lineBetween(-14, -112, -9, -107)                                   // parallel cut

  // ── HUGE D GRIN — most important Luffy feature ──────────────────────────────
  // upper lip
  g.fillStyle(0xd4a060); g.fillRoundedRect(-11, -108, 22, 3, 2)
  g.lineStyle(1.5, 0x000000, 1); g.strokeRoundedRect(-11, -108, 22, 3, 2)
  // massive mouth cavity
  g.fillStyle(0x220000); g.fillRoundedRect(-10, -107, 20, 12, 5)
  g.lineStyle(2.5, 0x000000, 1); g.strokeRoundedRect(-10, -107, 20, 12, 5)
  // bright white teeth — top row prominently showing
  g.fillStyle(0xfcfcfc); g.fillRect(-9, -107, 18, 5.5)
  // bold tooth gap lines (Luffy has pronounced individual teeth)
  g.lineStyle(1.5, 0xbbbbbb, 1)
  g.lineBetween(-5, -107, -5, -101); g.lineBetween(-1, -107, -1, -101)
  g.lineBetween(3, -107, 3, -101);   g.lineBetween(7, -107, 7, -101)
  // lower lip
  g.fillStyle(0xd4a060); g.fillRect(-10, -96, 20, 2.5)
  g.lineStyle(1, 0x000000, 0.6); g.strokeRect(-10, -96, 20, 2.5)

  // ── NOSE (small anime curve) ─────────────────────────────────────────────────
  g.lineStyle(1.5, 0xd4a060, 0.70)
  g.lineBetween(-3, -112, -3, -110); g.lineBetween(3, -112, 3, -110)
  g.lineBetween(-3, -110, 3, -110)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MESSY BLACK HAIR ━━
  // hair base over top of head
  g.fillStyle(0x111111); g.fillRoundedRect(-16, -134, 32, 10, {tl:13,tr:13,bl:0,br:0})
  g.lineStyle(2, 0x000000, 1); g.strokeRoundedRect(-16, -134, 32, 10, {tl:13,tr:13,bl:0,br:0})
  // messy forward-projecting spikes (Luffy's chaotic hair sticks forward/out)
  g.fillStyle(0x111111)
  g.fillPoints([{x:-16,y:-132},{x:-26,y:-152},{x:-12,y:-134}], true)  // left spike
  g.fillPoints([{x:-10,y:-133},{x:-16,y:-155},{x:0,y:-135}], true)    // left-centre spike
  g.fillPoints([{x:0,y:-133},{x:-4,y:-150},{x:10,y:-133}], true)      // centre spike
  g.fillPoints([{x:9,y:-132},{x:8,y:-148},{x:18,y:-132}], true)       // right spike
  // hair above forehead overhang
  g.fillStyle(0x222222, 0.5)
  g.fillPoints([{x:-12,y:-132},{x:-18,y:-144},{x:-5,y:-134}], true)
  g.fillPoints([{x:-2,y:-132},{x:-6,y:-143},{x:6,y:-132}], true)
  // hair outline
  g.lineStyle(2, 0x000000, 1)
  g.strokePoints([{x:-16,y:-132},{x:-26,y:-152},{x:-12,y:-134}], true)
  g.strokePoints([{x:-10,y:-133},{x:-16,y:-155},{x:0,y:-135}], true)
  g.strokePoints([{x:0,y:-133},{x:-4,y:-150},{x:10,y:-133}], true)
  g.strokePoints([{x:9,y:-132},{x:8,y:-148},{x:18,y:-132}], true)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ STRAW HAT ━━
  // Hat shadow cast onto face/hair
  g.fillStyle(0x442200, 0.18); g.fillEllipse(0, -130, 44, 8)

  // Wide flat BRIM — 3 layers for rounded 3-D look
  g.fillStyle(0xb88800); g.fillEllipse(0, -132, 62, 14)               // brim underside (darkest)
  g.fillStyle(0xd4a800); g.fillEllipse(0, -134, 62, 13)               // brim mid
  g.fillStyle(0xf5c842); g.fillEllipse(0, -136, 60, 10)               // brim top surface
  g.fillStyle(0xffe066); g.fillEllipse(0, -137, 54, 6)                 // brim highlight
  g.lineStyle(2.5, 0x000000, 1); g.strokeEllipse(0, -134, 62, 13)     // main brim outline

  // CAP body (dome on top of brim)
  g.fillStyle(0xd4a000); g.fillRoundedRect(-15, -155, 30, 22, 8)      // cap side/shadow
  g.fillStyle(0xe8b820); g.fillRoundedRect(-14, -156, 28, 22, 7)      // cap main
  g.fillStyle(0xf5c842); g.fillRoundedRect(-13, -156, 26, 14, 6)      // cap upper highlight
  g.fillStyle(0xffe066, 0.5); g.fillEllipse(0, -152, 18, 6)           // cap dome shine
  g.lineStyle(2.5, 0x000000, 1); g.strokeRoundedRect(-14, -156, 28, 22, 7)

  // RED BAND (iconic Luffy hat band)
  g.fillStyle(0xdd1100); g.fillRect(-17, -136, 34, 6)
  g.lineStyle(2, 0x000000, 1); g.strokeRect(-17, -136, 34, 6)
  g.fillStyle(0xff3322, 0.5); g.fillRect(-17, -136, 34, 2)            // band highlight
  g.fillStyle(0xaa0000, 0.4); g.fillRect(-17, -132, 34, 2)            // band bottom shadow
}


/* ─────────────────────────────────────── SOUL REAPER (Bleach-inspired) ── */
function drawSoulReaper(g) {
  g.fillStyle(0x000000, 0.15); g.fillEllipse(0, 0, 40, 8)
  g.fillStyle(0xfafafa); g.fillRoundedRect(-11, -14, 10, 14, 2); g.fillRoundedRect(1, -14, 10, 14, 2)
  g.fillStyle(0x0d0d0d); g.fillRect(-13, -42, 12, 28); g.fillRect(1, -42, 12, 28)
  g.fillStyle(0x111111); g.fillRoundedRect(-16, -78, 32, 38, 3)
  g.fillStyle(0xfafafa); g.fillRect(-4, -78, 8, 14)
  g.fillStyle(0x111111); g.fillRect(-3, -78, 6, 14)
  g.fillStyle(0xfafafa); g.fillRect(-16, -44, 32, 6)
  g.fillStyle(0x1a1a1a); g.fillRect(14, -104, 5, 72)
  g.fillStyle(0xe0e8f0); g.fillRect(16, -108, 3, 8)
  g.fillStyle(0xd4af37); g.fillRect(11, -76, 12, 5)
  g.fillStyle(0x5a3208); g.fillRect(14, -72, 5, 12)
  g.fillStyle(0x111111); g.fillRect(-24, -72, 10, 26)
  g.fillStyle(0xeec898); g.fillRoundedRect(-13, -100, 26, 24, 10)
  g.fillStyle(0x884400); g.fillEllipse(-4, -88, 11, 9)
  g.fillStyle(0x884400); g.fillEllipse(5, -88, 11, 9)
  g.fillStyle(0x331100); g.fillEllipse(-4, -88, 6, 6)
  g.fillStyle(0x331100); g.fillEllipse(5, -88, 6, 6)
  g.fillStyle(0xffffff, 0.9); g.fillEllipse(-2, -91, 3.5, 3.5)
  g.fillStyle(0xffffff, 0.9); g.fillEllipse(7, -91, 3.5, 3.5)
  g.fillStyle(0xffffff, 0.4); g.fillEllipse(-5, -86, 2, 2)
  g.fillStyle(0x111111); g.fillRect(-9, -94, 8, 2.5); g.fillRect(1, -94, 8, 2.5)
  g.fillStyle(0x111111); g.fillRect(-9, -94, 2, 5)
  g.fillStyle(0x1a0a00); g.fillRect(-5, -81, 10, 2.5)
  g.fillStyle(0x1a0a00); g.fillRect(3, -83, 3, 4)
  g.fillStyle(0xff6622)
  g.fillTriangle(-13, -98, -20, -120, -3, -100)
  g.fillTriangle(-3, -98, -7, -122, 6, -100)
  g.fillTriangle(6, -98, 3, -118, 15, -96)
  g.fillStyle(0xee5511)
  g.fillTriangle(-9, -98, -15, -110, 0, -100)
  g.fillTriangle(2, -98, 0, -112, 12, -98)
}

/* ──────────────────────────────── TITAN HUNTER (AOT-inspired) ── */
function drawTitanHunter(g) {
  // Shadow
  g.fillStyle(0x000000, 0.15); g.fillEllipse(0, 0, 40, 8)
  // Boots
  g.fillStyle(0x2a1a08); g.fillRoundedRect(-11, -18, 10, 18, 2); g.fillRoundedRect(1, -18, 10, 18, 2)
  // Brown pants
  g.fillStyle(0x6a4820); g.fillRect(-11, -44, 10, 26); g.fillRect(1, -44, 10, 26)
  // White shirt
  g.fillStyle(0xf0ece0); g.fillRoundedRect(-15, -74, 30, 32, 3)
  // Cravat / collar
  g.fillStyle(0xfafafa); g.fillRect(-4, -74, 8, 10)
  g.fillStyle(0xd0ccc0); g.fillRect(-4, -66, 8, 6)
  // Harness straps (ODM gear)
  g.fillStyle(0x6a4820)
  g.fillRect(-14, -72, 3, 30)   // left strap
  g.fillRect(11, -72, 3, 30)    // right strap
  g.fillRect(-14, -55, 28, 3)   // horizontal strap
  // Survey corps green cloak
  g.fillStyle(0x2a6634, 0.88)
  g.fillTriangle(-16, -72, -28, -40, -14, -44)   // left flap
  g.fillTriangle(16, -72, 28, -40, 14, -44)    // right flap
  // ODM blades
  g.fillStyle(0xccddee); g.fillRect(-28, -60, 14, 3); g.fillRect(-28, -60, 3, 12)   // left blade
  g.fillStyle(0x8aabbb, 0.5); g.fillRect(-28, -55, 14, 1)
  // Wings of Freedom patch on back / chest
  g.fillStyle(0xffffff, 0.6); g.fillEllipse(0, -58, 14, 7)
  // Head
  g.fillStyle(0xeec898); g.fillRoundedRect(-12, -100, 24, 25, 9)
  // Eyes — sharp / cold but vivid with shine
  g.fillStyle(0x404868); g.fillEllipse(-4, -88, 10, 8)
  g.fillStyle(0x404868); g.fillEllipse(4, -88, 10, 8)
  g.fillStyle(0x1a1e30); g.fillEllipse(-4, -88, 6, 5)
  g.fillStyle(0x1a1e30); g.fillEllipse(4, -88, 6, 5)
  g.fillStyle(0xffffff, 0.9); g.fillEllipse(-2, -91, 3.5, 3.5)
  g.fillStyle(0xffffff, 0.9); g.fillEllipse(6, -91, 3.5, 3.5)
  g.fillStyle(0xffffff, 0.4); g.fillEllipse(-5, -86, 2, 2)
  // Resolute eyebrows (flat, stern)
  g.fillStyle(0x111111); g.fillRect(-8, -94, 8, 2); g.fillRect(0, -94, 8, 2)
  // Pursed confident mouth
  g.fillStyle(0x1a0a00); g.fillRect(-4, -81, 8, 2.5)
  g.fillStyle(0xcc9966, 0.5); g.fillRect(-4, -82, 8, 1.5)
  // Undercut dark hair
  g.fillStyle(0x111111)
  g.fillRoundedRect(-12, -102, 24, 12, { tl: 9, tr: 9, bl: 0, br: 0 })
  g.fillRect(-12, -102, 24, 6)  // top of head hair
  // Slight side part
  g.fillStyle(0x222222)
  g.fillRect(-1, -103, 2, 7)
}

/* ──────────────────────────────── EMBER SLAYER (Demon Slayer-inspired) ── */
function drawEmberSlayer(g) {
  // Shadow
  g.fillStyle(0x000000, 0.15); g.fillEllipse(0, 0, 40, 8)
  // Tabi boots & wraps
  g.fillStyle(0xfafafa); g.fillRoundedRect(-11, -14, 10, 14, 2); g.fillRoundedRect(1, -14, 10, 14, 2)
  g.fillStyle(0x1a0a00); g.fillRect(-11, -28, 10, 14); g.fillRect(1, -28, 10, 14)
  // Hakama (dark)
  g.fillStyle(0x111122); g.fillRect(-12, -48, 24, 20)
  // Base uniform (dark)
  g.fillStyle(0x1a1a2a); g.fillRoundedRect(-15, -78, 30, 32, 3)
  // Checker haori (cape) — green+black pattern
  const checkSize = 6
  const haoriTop = -78, haoricols = [0x229966, 0x111122]
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = -18 + col * checkSize
      const cy = haoricols[(row + col) % 2 === 0 ? 0 : 1]
      g.fillStyle(cy); g.fillRect(cx, haoriTop + row * checkSize, checkSize - 0.5, checkSize - 0.5)
    }
  }
  // Haori collar
  g.fillStyle(0xfafafa); g.fillRect(-15, -78, 3, 32); g.fillRect(12, -78, 3, 32)
  // Twin katanas on back
  g.fillStyle(0xe8eaf0); g.fillRect(-18, -108, 3, 50); g.fillRect(15, -108, 3, 50)
  g.fillStyle(0x229966); g.fillRect(-21, -70, 9, 4); g.fillRect(12, -70, 9, 4)   // guards
  g.fillStyle(0x884422); g.fillRect(-18, -60, 3, 12); g.fillRect(15, -60, 3, 12) // grips
  // Head
  g.fillStyle(0xeec898); g.fillRoundedRect(-12, -100, 24, 24, 9)
  // Eyes — focused / determined with teary shine
  g.fillStyle(0x880022); g.fillEllipse(-4, -89, 11, 9)
  g.fillStyle(0x880022); g.fillEllipse(4, -89, 11, 9)
  g.fillStyle(0x440011); g.fillEllipse(-4, -89, 6, 6)
  g.fillStyle(0x440011); g.fillEllipse(4, -89, 6, 6)
  g.fillStyle(0xffffff, 0.9); g.fillEllipse(-2, -92, 3.5, 3.5)
  g.fillStyle(0xffffff, 0.9); g.fillEllipse(6, -92, 3.5, 3.5)
  g.fillStyle(0xffffff, 0.5); g.fillEllipse(-5, -87, 2, 2)
  // Brave eyebrows (upswept)
  g.fillStyle(0x220011); g.fillRect(-8, -95, 8, 2.5); g.fillRect(0, -95, 8, 2.5)
  // Determined gritted smile
  g.fillStyle(0x1a0a00); g.fillRect(-5, -82, 10, 3)
  g.fillStyle(0xffffff); g.fillRect(-4, -82, 8, 1.5)  // teeth glimpse
  // Scar mark
  g.fillStyle(0xcc6644, 0.7); g.fillRect(-11, -86, 6, 2)
  // Hanafuda earring (right ear)
  g.fillStyle(0xdd2244); g.fillCircle(13, -94, 3)
  g.fillStyle(0xff8844); g.fillCircle(13, -90, 2)
  // Dark spiky/wavy hair with maroon tips
  g.fillStyle(0x111111)
  g.fillRoundedRect(-13, -102, 26, 12, { tl: 9, tr: 9, bl: 2, br: 2 })
  g.fillStyle(0x442222)
  g.fillTriangle(-13, -100, -19, -118, -3, -102)
  g.fillTriangle(-3, -100, -6, -120, 7, -102)
  g.fillTriangle(7, -100, 4, -116, 16, -100)
}

/* ──────────────────────────────── PLUS ULTRA (MHA Deku-inspired) ── */
function drawPlusUltra(g) {
  // Shadow
  g.fillStyle(0x000000, 0.15); g.fillEllipse(0, 0, 40, 8)
  // Red boots
  g.fillStyle(0xcc1100); g.fillRoundedRect(-12, -22, 11, 22, 3)
  g.fillStyle(0xcc1100); g.fillRoundedRect(1, -22, 11, 22, 3)
  g.fillStyle(0xee3322); g.fillRect(-12, -22, 11, 5); g.fillRect(1, -22, 11, 5)  // boot cuffs
  // Green costume
  g.fillStyle(0x22aa44); g.fillRoundedRect(-15, -76, 30, 55, 4)
  // White stripes on costume
  g.fillStyle(0xfafafa, 0.7)
  g.fillRect(-15, -55, 5, 35)  // side stripe L
  g.fillRect(10, -55, 5, 35)   // side stripe R
  // Chest emblem hint
  g.fillStyle(0xfafafa); g.fillRect(-4, -68, 8, 8)
  g.fillStyle(0x22aa44); g.fillRect(-2, -68, 4, 4)   // O emblem
  // Arm guards
  g.fillStyle(0x1a7a30); g.fillRect(-24, -70, 10, 26); g.fillRect(14, -70, 10, 26)
  g.fillStyle(0x116622); g.fillRect(-24, -70, 10, 5); g.fillRect(14, -70, 10, 5)
  // OFA lightning aura
  g.fillStyle(0x55aaff, 0.4)
  g.fillRect(-18, -76, 4, 60)
  g.fillRect(14, -76, 4, 60)
  g.fillStyle(0xaaddff, 0.25)
  g.fillRect(-22, -60, 6, 40)
  g.fillRect(16, -60, 6, 40)
  // Head / full-face mask with big green eyes
  g.fillStyle(0x1a1a1a); g.fillRoundedRect(-13, -100, 26, 24, 9)
  // Bunny-ear costume mask hints
  g.fillStyle(0x22aa44)
  g.fillRect(-8, -112, 5, 14)  // left ear
  g.fillRect(3, -112, 5, 14)   // right ear
  // Visor eye band — glowing
  g.fillStyle(0x33ee88, 0.95); g.fillRoundedRect(-12, -95, 24, 12, 4)
  g.fillStyle(0x22cc66); g.fillEllipse(-4, -89, 12, 10)
  g.fillStyle(0x22cc66); g.fillEllipse(5, -89, 12, 10)
  g.fillStyle(0x004422); g.fillEllipse(-4, -89, 7, 7)
  g.fillStyle(0x004422); g.fillEllipse(5, -89, 7, 7)
  g.fillStyle(0xffffff, 0.95); g.fillEllipse(-2, -92, 4, 4)    // big shine
  g.fillStyle(0xffffff, 0.95); g.fillEllipse(7, -92, 4, 4)
  g.fillStyle(0xaaffcc, 0.5);  g.fillEllipse(-6, -87, 2.5, 2.5)  // secondary shine
  g.fillStyle(0xaaffcc, 0.5);  g.fillEllipse(3, -87, 2.5, 2.5)
  // Hopeful smile on mask lower half
  g.fillStyle(0x1a1a1a); g.fillRect(-7, -82, 14, 3)
  g.fillStyle(0x33ee88, 0.35); g.fillRect(-6, -82, 12, 1.5)  // glow line on mouth
  // Wild green hair
  g.fillStyle(0x114422)
  g.fillTriangle(-13, -100, -22, -122, -1, -102)
  g.fillTriangle(-1, -100, -5, -124, 8, -102)
  g.fillTriangle(8, -100, 5, -118, 17, -98)
  g.fillStyle(0x226633)
  g.fillTriangle(-9, -100, -16, -115, 1, -102)
  g.fillTriangle(3, -100, 0, -116, 13, -100)
}
