// Sharing a character: a compact link (stats encoded in the URL hash) and a PNG card.
// Only the name, level and six scores are shared — nothing else from the save.
import { ABILITIES, ABILITY_KEYS, MIN_SCORE, MAX_SCORE } from "../data/gameData.js";
import { formatModifier, modifier, pickClass, rankAbilities } from "./scoring.js";

const HASH_KEY = "hero=";

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code) {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function shareUrl({ name, level, scores }) {
  const payload = { v: 1, n: name || "", l: level, s: ABILITY_KEYS.map((k) => scores[k]) };
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#${HASH_KEY}${toBase64Url(JSON.stringify(payload))}`;
}

/** Parse a shared hero from a URL hash. Everything is validated; bad input returns null. */
export function decodeShare(hash) {
  try {
    const i = (hash || "").indexOf(HASH_KEY);
    if (i === -1) return null;
    const data = JSON.parse(fromBase64Url(hash.slice(i + HASH_KEY.length)));
    if (!data || !Array.isArray(data.s) || data.s.length !== ABILITY_KEYS.length) return null;
    const scores = {};
    ABILITY_KEYS.forEach((k, idx) => {
      const n = Math.round(Number(data.s[idx]));
      if (!Number.isFinite(n)) throw new Error("bad score");
      scores[k] = Math.min(MAX_SCORE, Math.max(MIN_SCORE, n));
    });
    const level = Math.min(99, Math.max(1, Math.round(Number(data.l)) || 1));
    const name = typeof data.n === "string" ? data.n.slice(0, 40) : "";
    return { name, level, scores, heroClass: pickClass(scores) };
  } catch {
    return null;
  }
}

// ── PNG card ────────────────────────────────────────────────────────────

const W = 1080;
const H = 1350;
const INK = "#2a1a0c";
const INK_SOFT = "#5b4327";
const BLOOD = "#8a1c1c";

async function loadFonts() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load('900 60px "Cinzel"'),
    document.fonts.load('700 30px "Cinzel"'),
    document.fonts.load('700 80px "Cinzel Decorative"'),
    document.fonts.load('italic 400 34px "EB Garamond"'),
  ]).catch(() => {});
}

function parchment(ctx) {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#f3e6c4");
  g.addColorStop(1, "#e3cd98");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // speckled grain
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = `rgba(110, 75, 30, ${Math.random() * 0.07})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  // vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(120, 80, 25, 0.35)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // double rule
  ctx.strokeStyle = "rgba(90, 60, 25, 0.6)";
  ctx.lineWidth = 3;
  ctx.strokeRect(34, 34, W - 68, H - 68);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(48, 48, W - 96, H - 96);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, font, startSize) {
  let size = startSize;
  do {
    ctx.font = font.replace("{size}", size);
    size -= 4;
  } while (ctx.measureText(text).width > maxWidth && size > 24);
}

/** Draw the shareable card and resolve with a PNG Blob. */
export async function renderShareCard({ name, level, scores, heroClass, background }) {
  await loadFonts();
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  parchment(ctx);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = BLOOD;
  ctx.font = '700 30px "Cinzel", Georgia, serif';
  ctx.fillText("❦  A REAL-LIFE CHARACTER SHEET  ❦", W / 2, 130);

  ctx.fillStyle = INK;
  fitText(ctx, name || "Nameless Hero", W - 200, '700 {size}px "Cinzel Decorative", Georgia, serif', 92);
  ctx.fillText(name || "Nameless Hero", W / 2, 250);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(180, 285);
  ctx.lineTo(W - 180, 285);
  ctx.stroke();

  ctx.fillStyle = BLOOD;
  ctx.font = '700 44px "Cinzel", Georgia, serif';
  ctx.fillText(`Level ${level} ${heroClass}`, W / 2, 350);
  if (background) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = 'italic 400 34px "EB Garamond", Georgia, serif';
    ctx.fillText(`${background} · Human of the Waking World`, W / 2, 400);
  }

  // Ability boxes, 3 × 2
  const best = rankAbilities(scores)[0];
  const boxW = 270;
  const boxH = 270;
  const gapX = 40;
  const gapY = 66;
  const startX = (W - (boxW * 3 + gapX * 2)) / 2;
  const startY = 450;
  ABILITIES.forEach((a, i) => {
    const x = startX + (i % 3) * (boxW + gapX);
    const y = startY + Math.floor(i / 3) * (boxH + gapY);
    const highlight = a.key === best;
    roundRect(ctx, x, y, boxW, boxH, 22);
    ctx.fillStyle = "rgba(255, 250, 235, 0.6)";
    ctx.fill();
    ctx.lineWidth = highlight ? 6 : 4;
    ctx.strokeStyle = highlight ? BLOOD : INK;
    ctx.stroke();

    ctx.fillStyle = INK_SOFT;
    ctx.font = '700 28px "Cinzel", Georgia, serif';
    ctx.fillText(a.name.toUpperCase(), x + boxW / 2, y + 52);

    ctx.fillStyle = INK;
    ctx.font = '900 112px "Cinzel", Georgia, serif';
    ctx.fillText(formatModifier(modifier(scores[a.key])), x + boxW / 2, y + 170);

    // score oval
    ctx.beginPath();
    ctx.ellipse(x + boxW / 2, y + boxH, 62, 38, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f3e6c4";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = highlight ? BLOOD : INK;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = '700 46px "Cinzel", Georgia, serif';
    ctx.fillText(String(scores[a.key]), x + boxW / 2, y + boxH + 16);
  });

  ctx.fillStyle = INK;
  ctx.font = '700 40px "Cinzel", Georgia, serif';
  ctx.fillText("What are YOUR real-life stats?", W / 2, H - 125);
  ctx.fillStyle = BLOOD;
  ctx.font = 'italic 400 34px "EB Garamond", Georgia, serif';
  ctx.fillText(`${window.location.host}${window.location.pathname}`.replace(/\/$/, ""), W / 2, H - 78);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
