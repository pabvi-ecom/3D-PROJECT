"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MiniGame.module.css";

// 9:16 vertical — usa el hueco que sobraba debajo del canvas horizontal viejo.
const W = 270;
const H = 480;
const GROUND_Y = H - 46;
const GRAVITY = 1.1;
const JUMP_V = -16.5;
const DOG_X = 40;
const DOG_W = 30;
const DOG_H = 46;

type ObstacleKind = "bush" | "tree" | "house" | "car" | "cat";
type Obstacle = { x: number; w: number; h: number; kind: ObstacleKind };
type Popup = { x: number; y: number; life: number; text: string };

const KINDS: ObstacleKind[] = ["bush", "tree", "house", "car", "cat"];

// Hitos de descuento — cuanto más lejos llegues, mejor descuento.
const DISCOUNT_MILESTONES = [
  { score: 50, pct: 5 },
  { score: 150, pct: 10 },
];

function makeDiscountCode(pct: number) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PLAY${pct}-${rand}`;
}

export function MiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const stateRef = useRef({
    dogY: GROUND_Y - DOG_H,
    vy: 0,
    jumping: false,
    obstacles: [] as Obstacle[],
    popups: [] as Popup[],
    nextGapFrames: 70,
    framesSinceSpawn: 0,
    speed: 5.2,
    frame: 0,
    score: 0,
    dead: false,
    discountPct: 0,
    milestoneIdx: 0,
  });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [dead, setDead] = useState(false);
  const [started, setStarted] = useState(false);

  function jump() {
    const s = stateRef.current;
    if (s.dead) {
      restart();
      return;
    }
    if (!started) setStarted(true);
    if (!s.jumping) {
      s.vy = JUMP_V;
      s.jumping = true;
    }
  }

  function restart() {
    const s = stateRef.current;
    s.dogY = GROUND_Y - DOG_H;
    s.vy = 0;
    s.jumping = false;
    s.obstacles = [];
    s.popups = [];
    s.nextGapFrames = 70;
    s.framesSinceSpawn = 0;
    s.speed = 5.2;
    s.frame = 0;
    s.score = 0;
    s.dead = false;
    s.discountPct = 0;
    s.milestoneIdx = 0;
    setScore(0);
    setDiscountPct(0);
    setDiscountCode("");
    setDead(false);
    setStarted(true);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/game/dog-sprite.png";
    spriteRef.current = img;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let raf: number;

    function drawBush(x: number, groundY: number, w: number, h: number) {
      ctx!.fillStyle = "#4C9A5B";
      const r = h * 0.55;
      ctx!.beginPath();
      ctx!.arc(x + w * 0.3, groundY - r * 0.8, r * 0.7, 0, Math.PI * 2);
      ctx!.arc(x + w * 0.65, groundY - r, r * 0.85, 0, Math.PI * 2);
      ctx!.arc(x + w * 0.9, groundY - r * 0.75, r * 0.6, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawTree(x: number, groundY: number, w: number, h: number) {
      const trunkW = w * 0.28;
      ctx!.fillStyle = "#8A5A34";
      ctx!.fillRect(x + w / 2 - trunkW / 2, groundY - h * 0.4, trunkW, h * 0.4);
      ctx!.fillStyle = "#3E8C4F";
      ctx!.beginPath();
      ctx!.arc(x + w / 2, groundY - h * 0.55, w * 0.55, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawHouse(x: number, groundY: number, w: number, h: number) {
      ctx!.fillStyle = "#D98A5F";
      ctx!.fillRect(x, groundY - h * 0.62, w, h * 0.62);
      ctx!.fillStyle = "#B5472E";
      ctx!.beginPath();
      ctx!.moveTo(x - 4, groundY - h * 0.6);
      ctx!.lineTo(x + w / 2, groundY - h);
      ctx!.lineTo(x + w + 4, groundY - h * 0.6);
      ctx!.closePath();
      ctx!.fill();
      ctx!.fillStyle = "#FDE9B8";
      ctx!.fillRect(x + w * 0.35, groundY - h * 0.42, w * 0.3, h * 0.28);
    }

    function drawCar(x: number, groundY: number, w: number, h: number) {
      ctx!.fillStyle = "#3E7CD6";
      ctx!.beginPath();
      ctx!.roundRect(x, groundY - h, w, h * 0.65, 4);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.roundRect(x + w * 0.18, groundY - h * 1.5, w * 0.6, h * 0.6, 5);
      ctx!.fill();
      ctx!.fillStyle = "#233";
      ctx!.beginPath();
      ctx!.arc(x + w * 0.24, groundY, h * 0.16, 0, Math.PI * 2);
      ctx!.arc(x + w * 0.76, groundY, h * 0.16, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawCat(x: number, groundY: number, w: number, h: number) {
      ctx!.fillStyle = "#8A8D8F";
      ctx!.beginPath();
      ctx!.ellipse(x + w / 2, groundY - h * 0.4, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.moveTo(x + w * 0.15, groundY - h * 0.7);
      ctx!.lineTo(x + w * 0.05, groundY - h);
      ctx!.lineTo(x + w * 0.32, groundY - h * 0.75);
      ctx!.closePath();
      ctx!.moveTo(x + w * 0.68, groundY - h * 0.75);
      ctx!.lineTo(x + w * 0.95, groundY - h);
      ctx!.lineTo(x + w * 0.85, groundY - h * 0.7);
      ctx!.closePath();
      ctx!.fill();
    }

    function drawObstacle(o: Obstacle) {
      if (o.kind === "bush") drawBush(o.x, GROUND_Y, o.w, o.h);
      else if (o.kind === "tree") drawTree(o.x, GROUND_Y, o.w, o.h);
      else if (o.kind === "house") drawHouse(o.x, GROUND_Y, o.w, o.h);
      else if (o.kind === "car") drawCar(o.x, GROUND_Y, o.w, o.h);
      else drawCat(o.x, GROUND_Y, o.w, o.h);
    }

    function drawPopup(c: Popup) {
      const t = c.life / 50;
      const y = c.y - t * 40;
      ctx!.globalAlpha = Math.max(0, 1 - t);
      ctx!.fillStyle = "#F4B400";
      ctx!.beginPath();
      ctx!.roundRect(c.x - 24, y - 12, 48, 24, 12);
      ctx!.fill();
      ctx!.fillStyle = "#7A5300";
      ctx!.font = "bold 12px sans-serif";
      ctx!.textAlign = "center";
      ctx!.fillText(c.text, c.x, y + 4);
      ctx!.globalAlpha = 1;
    }

    function loop() {
      const s = stateRef.current;
      ctx!.clearRect(0, 0, W, H);

      // cielo con degradado + sol
      const sky = ctx!.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, "#CFE8FF");
      sky.addColorStop(1, "#EAF3FE");
      ctx!.fillStyle = sky;
      ctx!.fillRect(0, 0, W, GROUND_Y);

      // nubes
      ctx!.fillStyle = "rgba(255,255,255,.8)";
      [[60, 70, 22], [100, 80, 16], [30, 130, 18]].forEach(([cx, cy, r]) => {
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.arc(cx + r * 0.9, cy + 4, r * 0.75, 0, Math.PI * 2);
        ctx!.fill();
      });

      // césped
      ctx!.fillStyle = "#5FAE6A";
      ctx!.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx!.fillStyle = "#4C9A5B";
      ctx!.fillRect(0, GROUND_Y, W, 4);

      if (started && !s.dead) {
        s.frame++;
        s.vy += GRAVITY;
        s.dogY += s.vy;
        if (s.dogY > GROUND_Y - DOG_H) {
          s.dogY = GROUND_Y - DOG_H;
          s.vy = 0;
          s.jumping = false;
        }

        s.framesSinceSpawn++;
        if (s.framesSinceSpawn >= s.nextGapFrames) {
          s.framesSinceSpawn = 0;
          // Alterna huecos cortos y largos — no siempre a la misma distancia.
          const isShort = Math.random() < 0.5;
          const base = isShort ? 55 : 110;
          s.nextGapFrames = Math.max(46, base - s.speed * 3 + Math.random() * 26);

          const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
          const h = kind === "bush" ? 16 + Math.random() * 8 : kind === "cat" ? 20 : kind === "car" ? 30 : kind === "house" ? 46 : 30 + Math.random() * 14;
          const w = kind === "bush" ? 26 + Math.random() * 10 : kind === "cat" ? 26 : kind === "car" ? 46 : kind === "house" ? 40 : 20 + Math.random() * 8;
          s.obstacles.push({ x: W, w, h, kind });
        }

        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > 0);

        s.speed = Math.min(9, 5.2 + s.score / 18);
        s.score += 0.06;
        const floored = Math.floor(s.score);
        setScore(floored);

        // Hitos de descuento (score 50 → 5%, score 150 → 10%)
        const next = DISCOUNT_MILESTONES[s.milestoneIdx];
        if (next && floored >= next.score) {
          s.milestoneIdx++;
          s.discountPct = next.pct;
          s.popups.push({ x: DOG_X + DOG_W / 2, y: s.dogY, life: 0, text: `${next.pct}% off!` });
          setDiscountPct(next.pct);
        }

        const pad = 6;
        const dogBox = { x: DOG_X + pad, y: s.dogY + pad, w: DOG_W - pad * 2, h: DOG_H - pad };
        for (const o of s.obstacles) {
          const oBox = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h };
          if (
            dogBox.x < oBox.x + oBox.w &&
            dogBox.x + dogBox.w > oBox.x &&
            dogBox.y < oBox.y + oBox.h &&
            dogBox.y + dogBox.h > oBox.y
          ) {
            s.dead = true;
            setDead(true);
            setBest((b) => Math.max(b, Math.floor(s.score)));
            if (s.discountPct > 0) setDiscountCode(makeDiscountCode(s.discountPct));
          }
        }
      }

      s.obstacles.forEach(drawObstacle);

      s.popups.forEach((c) => (c.life += 1));
      s.popups = s.popups.filter((c) => c.life < 50);
      s.popups.forEach(drawPopup);

      // perrito (figura real, sin fondo)
      const sprite = spriteRef.current;
      if (sprite && sprite.complete && sprite.naturalWidth > 0) {
        ctx!.drawImage(sprite, DOG_X, s.dogY + 6, DOG_W, DOG_H);
      }

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started]);

  return (
    <div className={styles.wrap}>
      <div className={styles.hud}>
        <span>🏆 {best}</span>
        <span>🎟️ {discountPct}%</span>
        <span>{score}</span>
      </div>
      <div className={styles.stage} onClick={jump}>
        <canvas ref={canvasRef} style={{ width: W, height: H }} className={styles.canvas} />
        {!started && !dead && (
          <div className={styles.overlay}>
            <p>🎮 Play and get discounts</p>
            <button className={styles.playBtn} onClick={jump}>Press space to play</button>
          </div>
        )}
        {dead && (
          <div className={styles.overlay}>
            <p>Game over — score {Math.floor(stateRef.current.score)}</p>
            {discountPct > 0 ? (
              <div className={styles.discountWon}>
                <span>🎉 You won {discountPct}% off!</span>
                <code>{discountCode}</code>
              </div>
            ) : (
              <p className={styles.discountHint}>Reach score 50 for 5% off, 150 for 10% off</p>
            )}
            <button className={styles.playBtn} onClick={restart}>Play again</button>
          </div>
        )}
      </div>
      <p className={styles.hint}>Press <kbd>Space</kbd> to jump</p>
    </div>
  );
}
