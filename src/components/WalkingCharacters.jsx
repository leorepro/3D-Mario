import { useEffect, useRef } from 'react';
import { VIEWPORT_WIDTH } from '../game/constants.js';

// ── Pixel-art SVG characters (16×24 grid, each cell = 2px) ──

const MARIO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 16 24" shape-rendering="crispEdges">
  <!-- Hat -->
  <rect x="3" y="0" width="8" height="2" fill="#e52521"/>
  <rect x="1" y="2" width="11" height="2" fill="#e52521"/>
  <!-- Face -->
  <rect x="2" y="4" width="9" height="1" fill="#fec77b"/>
  <rect x="1" y="5" width="11" height="4" fill="#fec77b"/>
  <!-- Eyes -->
  <rect x="2" y="5" width="2" height="2" fill="#3b2314"/>
  <rect x="8" y="5" width="2" height="2" fill="#3b2314"/>
  <!-- Mustache -->
  <rect x="2" y="7" width="9" height="2" fill="#5c3317"/>
  <!-- Body/overalls -->
  <rect x="3" y="9" width="7" height="5" fill="#049cd8"/>
  <rect x="1" y="10" width="3" height="4" fill="#e52521"/>
  <rect x="9" y="10" width="3" height="4" fill="#e52521"/>
  <!-- Buckles -->
  <rect x="4" y="9" width="2" height="1" fill="#fec77b"/>
  <rect x="7" y="9" width="2" height="1" fill="#fec77b"/>
  <!-- Legs -->
  <rect x="3" y="14" width="3" height="3" fill="#049cd8"/>
  <rect x="7" y="14" width="3" height="3" fill="#049cd8"/>
  <!-- Shoes -->
  <rect x="2" y="17" width="4" height="2" fill="#5c3317"/>
  <rect x="7" y="17" width="4" height="2" fill="#5c3317"/>
  <!-- Hands -->
  <rect x="0" y="11" width="2" height="2" fill="#fec77b"/>
  <rect x="11" y="11" width="2" height="2" fill="#fec77b"/>
</svg>`;

const PEACH_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 16 24" shape-rendering="crispEdges">
  <!-- Crown -->
  <rect x="4" y="0" width="7" height="1" fill="#fbd000"/>
  <rect x="3" y="1" width="1" height="2" fill="#fbd000"/>
  <rect x="7" y="0" width="1" height="3" fill="#fbd000"/>
  <rect x="11" y="1" width="1" height="2" fill="#fbd000"/>
  <!-- Crown gems -->
  <rect x="3" y="1" width="1" height="1" fill="#e52521"/>
  <rect x="7" y="0" width="1" height="1" fill="#049cd8"/>
  <rect x="11" y="1" width="1" height="1" fill="#e52521"/>
  <!-- Hair -->
  <rect x="2" y="3" width="11" height="1" fill="#fbd000"/>
  <rect x="1" y="4" width="3" height="3" fill="#fbd000"/>
  <rect x="11" y="4" width="3" height="3" fill="#fbd000"/>
  <!-- Face -->
  <rect x="3" y="4" width="9" height="4" fill="#fec77b"/>
  <!-- Eyes -->
  <rect x="4" y="5" width="2" height="2" fill="#3b2314"/>
  <rect x="9" y="5" width="2" height="2" fill="#3b2314"/>
  <!-- Blush -->
  <rect x="3" y="7" width="2" height="1" fill="#ffb3b3"/>
  <rect x="10" y="7" width="2" height="1" fill="#ffb3b3"/>
  <!-- Mouth -->
  <rect x="6" y="7" width="3" height="1" fill="#e52521"/>
  <!-- Dress (pink) -->
  <rect x="2" y="8" width="11" height="7" fill="#ff8fcc"/>
  <!-- Dress highlight -->
  <rect x="3" y="9" width="3" height="4" fill="#ffb3e0"/>
  <!-- Collar -->
  <rect x="5" y="8" width="5" height="1" fill="#ffffff"/>
  <!-- Skirt flare -->
  <rect x="1" y="14" width="13" height="3" fill="#ff8fcc"/>
  <rect x="0" y="15" width="15" height="2" fill="#ffb3e0"/>
  <!-- Shoes -->
  <rect x="4" y="17" width="3" height="2" fill="#e52521"/>
  <rect x="8" y="17" width="3" height="2" fill="#e52521"/>
  <!-- Arms -->
  <rect x="0" y="10" width="2" height="3" fill="#fec77b"/>
  <rect x="13" y="10" width="2" height="3" fill="#fec77b"/>
</svg>`;

const TOAD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 16 24" shape-rendering="crispEdges">
  <!-- Mushroom cap (red) -->
  <rect x="2" y="0" width="11" height="7" fill="#e52521"/>
  <!-- Cap spots (white) -->
  <rect x="3" y="1" width="3" height="3" fill="#ffffff"/>
  <rect x="9" y="1" width="3" height="3" fill="#ffffff"/>
  <rect x="6" y="4" width="3" height="2" fill="#ffffff"/>
  <!-- Cap brim -->
  <rect x="1" y="7" width="13" height="2" fill="#ffffff"/>
  <!-- Face -->
  <rect x="3" y="9" width="9" height="4" fill="#fec77b"/>
  <!-- Eyes -->
  <rect x="4" y="10" width="2" height="2" fill="#3b2314"/>
  <rect x="9" y="10" width="2" height="2" fill="#3b2314"/>
  <!-- Mouth/happy -->
  <rect x="6" y="12" width="3" height="1" fill="#5c3317"/>
  <!-- Body (white vest) -->
  <rect x="3" y="13" width="9" height="5" fill="#ffffff"/>
  <!-- Vest dots -->
  <rect x="5" y="14" width="1" height="1" fill="#ff8fcc"/>
  <rect x="9" y="14" width="1" height="1" fill="#ff8fcc"/>
  <!-- Legs -->
  <rect x="4" y="18" width="3" height="3" fill="#fec77b"/>
  <rect x="8" y="18" width="3" height="3" fill="#fec77b"/>
  <!-- Shoes -->
  <rect x="3" y="20" width="4" height="2" fill="#5c3317"/>
  <rect x="8" y="20" width="4" height="2" fill="#5c3317"/>
  <!-- Arms -->
  <rect x="1" y="14" width="2" height="2" fill="#fec77b"/>
  <rect x="12" y="14" width="2" height="2" fill="#fec77b"/>
</svg>`;

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

const MARIO_URL  = svgToDataUrl(MARIO_SVG);
const PEACH_URL  = svgToDataUrl(PEACH_SVG);
const TOAD_URL   = svgToDataUrl(TOAD_SVG);

const CHARS = [
  { name: 'mario', url: MARIO_URL,  speed: 55, startX: 40,  startDir:  1, yTop: 5 },
  { name: 'peach', url: PEACH_URL,  speed: 38, startX: 200, startDir: -1, yTop: 3 },
  { name: 'toad',  url: TOAD_URL,   speed: 70, startX: 300, startDir:  1, yTop: 7 },
];

const CHAR_W = 32;
const WALK_MARGIN = 12;
const MAX_X = VIEWPORT_WIDTH - CHAR_W - WALK_MARGIN;

function WalkingCharacter({ url, speed, startX, startDir, yTop }) {
  const divRef = useRef(null);
  const stateRef = useRef({ x: startX, dir: startDir, step: 0 });
  const rafRef   = useRef(null);
  const lastRef  = useRef(null);

  useEffect(() => {
    function animate(ts) {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;

      const s = stateRef.current;
      s.x += s.dir * speed * dt;
      if (s.x >= MAX_X) { s.x = MAX_X; s.dir = -1; }
      if (s.x <= WALK_MARGIN) { s.x = WALK_MARGIN; s.dir = 1; }

      // Bob up/down every ~0.3s
      s.step += dt;
      const bob = Math.round(Math.sin(s.step * 10) * 1.5);

      if (divRef.current) {
        divRef.current.style.left = `${s.x}px`;
        divRef.current.style.transform = `scaleX(${s.dir}) translateY(${bob}px)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed]);

  return (
    <div
      ref={divRef}
      className="absolute pointer-events-none"
      style={{
        top: `${yTop}%`,
        left: startX,
        width: CHAR_W,
        height: 48,
        imageRendering: 'pixelated',
        transformOrigin: 'center bottom',
      }}
    >
      <img
        src={url}
        width={32}
        height={48}
        alt=""
        style={{ imageRendering: 'pixelated', display: 'block' }}
        draggable={false}
      />
    </div>
  );
}

export function WalkingCharacters() {
  return (
    <>
      {CHARS.map(c => (
        <WalkingCharacter key={c.name} {...c} />
      ))}
    </>
  );
}
