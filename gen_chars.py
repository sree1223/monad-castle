"""
MonCastle — Gemini AI Character Image Generator
Generates pixel-art character portraits using Google Gemini 2.0 Flash.
Saves output PNGs to frontend/public/chars/

Usage:
  pip install requests Pillow
  python gen_chars.py
"""

import requests
import base64
import json
import os
import struct
import zlib

API_KEY = "AIzaSyCRY-RGZBYqvx-hSp8Y_BBBlLVMvL5WGIE"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key={API_KEY}"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "frontend", "public", "chars")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Set to True to regenerate images even if they already exist
FORCE_REGEN = True

# Shared sprite requirements for every character
_SPRITE_BASE = (
    "Full-body 2D game character sprite on a PURE TRANSPARENT background. "
    "Entire body clearly visible: head with distinctive hair, face, torso, "
    "both arms and hands (one holding weapon), both legs and feet in wide battle stance. "
    "Pixel art 16-bit SNES RPG style, bold black 2px outlines, limited 32-color palette. "
    "Character faces slightly right in dynamic action pose. Height roughly 96x128 pixels. "
    "NO background patterns, NO text, NO UI, NO border frame. Transparent alpha channel."
)

CHARACTERS = [
    {
        "id": "sage",
        "prompt": (
            "Naruto-inspired ninja warrior. Spiky bright blonde hair with red spiral forehead protector headband. "
            "Orange jacket with blue shoulders and collar, orange pants with black leg wraps. "
            "Left hand held up in a ninja hand-seal gesture (fingers crossed). "
            "Right hand forward ready to throw a glowing shuriken star. "
            "Blue eyes, determined expression, red whisker marks on cheeks. "
            "Orange and blue color scheme, vibrant and bold. " + _SPRITE_BASE
        ),
    },
    {
        "id": "brawler",
        "prompt": (
            "One Piece Luffy-inspired rubber pirate fighter. Black messy hair, iconic straw hat on head. "
            "Red short-sleeved vest, blue shorts, sandals. Big grin, scar under left eye. "
            "Right arm stretched WAY forward in a powerful rubber punch, fist large and prominent. "
            "Left arm pulled back for momentum. Slightly crouched wide stance showing legs and feet. "
            "Red, white, blue color scheme, cartoonish fun style. " + _SPRITE_BASE
        ),
    },
    {
        "id": "reaper",
        "prompt": (
            "Bleach Ichigo-inspired soul reaper swordsman. Tall spiky bright orange hair, intense eyes. "
            "All-black kimono robe (hakama), white sash at waist, white bandage wraps on arms. "
            "Holding an enormous black cleaver sword (zanpakuto) over right shoulder with both hands. "
            "Aggressive battle stance, legs wide apart, feet planted firmly on ground. "
            "Black and white with orange hair accent, dark intense style. " + _SPRITE_BASE
        ),
    },
    {
        "id": "hunter",
        "prompt": (
            "Attack on Titan Levi-inspired scout soldier. Short dark undercut hair, pale skin, stern expression. "
            "White button-up shirt, tan pants, dark boots, Survey Corps green cloak cape flowing behind. "
            "Holding two ODM gear short blades - one in each hand in dual-wield cross pose. "
            "Alert crouching stance ready to launch, both legs bent and visible. "
            "Green, tan, white color scheme, military realism style. " + _SPRITE_BASE
        ),
    },
    {
        "id": "slayer",
        "prompt": (
            "Demon Slayer Tanjiro-inspired swordsman. Dark hair with red tips, hanafuda earrings, "
            "scar on upper forehead, kind determined eyes. Distinctive black-and-green checkered haori "
            "cape over dark kimono, black hakama pants, zori sandals with white socks. "
            "Holding a red-bladed katana sword in two-handed Water Breathing stance angled forward. "
            "Legs in wide martial arts stance, body turned sideways showing profile. "
            "Green, black, red color scheme. " + _SPRITE_BASE
        ),
    },
    {
        "id": "hero",
        "prompt": (
            "My Hero Academia Deku-inspired superhero. Wild fluffy green curly hair, freckles on cheeks. "
            "Green bodysuit with white chest plating, red boots with white lines, red gloves. "
            "Arms raised heroically - right arm reaching forward crackling with green lightning electricity. "
            "Left fist raised upward, cape flowing. Wide heroic stance showing both legs. "
            "Green and white primary colors, bright electric green lightning effects. " + _SPRITE_BASE
        ),
    },
]


def call_gemini(prompt: str) -> bytes | None:
    """Call Gemini image generation and return raw PNG bytes."""
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}],
                "role": "user",
            }
        ],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"],
        },
    }

    print(f"  → Calling Gemini API…")
    resp = requests.post(API_URL, json=payload, timeout=60)

    if resp.status_code != 200:
        print(f"  ✗ API error {resp.status_code}: {resp.text[:300]}")
        return None

    data = resp.json()

    # Extract image part
    try:
        parts = data["candidates"][0]["content"]["parts"]
        for part in parts:
            if "inlineData" in part:
                mime  = part["inlineData"].get("mimeType", "image/png")
                b64   = part["inlineData"]["data"]
                raw   = base64.b64decode(b64)
                return raw
        print("  ✗ No image in response. Text parts:")
        for part in parts:
            if "text" in part:
                print(f"    {part['text'][:200]}")
    except (KeyError, IndexError) as e:
        print(f"  ✗ Parse error: {e}")
        print(f"  Response keys: {list(data.keys())}")

    return None


def save_png(path: str, data: bytes):
    """Save raw bytes as PNG (Gemini returns PNG by default)."""
    with open(path, "wb") as f:
        f.write(data)
    size_kb = len(data) / 1024
    print(f"  ✓ Saved: {path} ({size_kb:.1f} KB)")


def main():
    print("=" * 56)
    print("  MonCastle — Gemini Character Image Generator")
    print("=" * 56)
    print(f"  Output: {OUTPUT_DIR}\n")

    results = []
    for char in CHARACTERS:
        print(f"[{char['id'].upper()}]")
        out_path = os.path.join(OUTPUT_DIR, f"{char['id']}.png")

        if os.path.exists(out_path) and not FORCE_REGEN:
            print(f"  ⚡ Already exists, skipping. (set FORCE_REGEN=True to regenerate)")
            results.append((char["id"], True))
            continue

        if os.path.exists(out_path) and FORCE_REGEN:
            os.remove(out_path)
            print(f"  ⟳ Force-regenerating…")

        img_data = call_gemini(char["prompt"])
        if img_data:
            save_png(out_path, img_data)
            results.append((char["id"], True))
        else:
            print(f"  ✗ Failed to generate image for {char['id']}")
            results.append((char["id"], False))
        print()

    print("-" * 56)
    print("  Results:")
    for cid, ok in results:
        status = "✓" if ok else "✗"
        print(f"  {status} {cid}.png")
    print("-" * 56)
    print(f"\n  Images saved to: {OUTPUT_DIR}")
    print("  Use them in React: <img src='/chars/sage.png' />")


if __name__ == "__main__":
    main()
