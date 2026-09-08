"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MiniGame.module.css";

const W = 320;
const H = 220;
const GROUND_Y = H - 26;
const GRAVITY = 0.85;
const JUMP_V = -13.5;
const DOG_X = 40;
const DOG_W = 30;
const DOG_H = 46;

type ObstacleKind = "bush" | "tree";
type Obstacle = { x: number; w: number; h: number; kind: ObstacleKind };

export function MiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const stateRef = useRef({
    dogY: GROUND_Y - DOG_H,
    vy: 0,
    jumping: false,
    obstacles: [] as Obstacle[],
    speed: 3.2,
    frame: 0,
    score: 0,
    dead: false,
  });
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
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
    s.speed = 3.2;
    s.frame = 0;
    s.score = 0;
    s.dead = false;
    setScore(0);
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

    function loop() {
      const s = stateRef.current;
      ctx!.clearRect(0, 0, W, H);

      // cielo
      ctx!.fillStyle = "#EAF3FE";
      ctx!.fillRect(0, 0, W, GROUND_Y);

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

        const spawnEvery = Math.max(72, 100 - s.speed * 6);
        if (s.frame % Math.round(spawnEvery) === 0) {
          const kind: ObstacleKind = Math.random() < 0.6 ? "bush" : "tree";
          const h = kind === "bush" ? 16 + Math.random() * 8 : 30 + Math.random() * 14;
          const w = kind === "bush" ? 26 + Math.random() * 10 : 20 + Math.random() * 8;
          s.obstacles.push({ x: W, w, h, kind });
        }

        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > 0);

        s.speed = Math.min(6.5, 3.2 + s.score / 22);
        s.score += 0.06;
        setScore(Math.floor(s.score));

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
          }
        }
      }

      // obstáculos
      s.obstacles.forEach((o) => {
        if (o.kind === "bush") drawBush(o.x, GROUND_Y, o.w, o.h);
        else drawTree(o.x, GROUND_Y, o.w, o.h);
      });

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
        <span>{score}</span>
      </div>
      <div className={styles.stage} onClick={jump}>
        <canvas ref={canvasRef} style={{ width: W, height: H }} className={styles.canvas} />
        {!started && !dead && (
          <div className={styles.overlay}>
            <p>Bored while we work? 🐾</p>
            <button className={styles.playBtn} onClick={jump}>Press space to play</button>
          </div>
        )}
        {dead && (
          <div className={styles.overlay}>
            <p>Game over — score {Math.floor(stateRef.current.score)}</p>
            <button className={styles.playBtn} onClick={restart}>Play again</button>
          </div>
        )}
      </div>
      <p className={styles.hint}>Press <kbd>Space</kbd> to jump</p>
    </div>
  );
}
