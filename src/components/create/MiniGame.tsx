"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MiniGame.module.css";

const W = 320;
const H = 220;
const GROUND_Y = H - 30;
const GRAVITY = 0.9;
const JUMP_V = -13;
const DOG_X = 44;
const DOG_SIZE = 26;

type Obstacle = { x: number; w: number; h: number };

export function MiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    dogY: GROUND_Y - DOG_SIZE,
    vy: 0,
    jumping: false,
    obstacles: [] as Obstacle[],
    speed: 4,
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
    s.dogY = GROUND_Y - DOG_SIZE;
    s.vy = 0;
    s.jumping = false;
    s.obstacles = [];
    s.speed = 4;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const bg = new Image();
    bg.src = "/pet/waves-bg.jpg";

    function loop() {
      const s = stateRef.current;
      ctx!.clearRect(0, 0, W, H);
      if (bg.complete) {
        ctx!.globalAlpha = 0.3;
        ctx!.drawImage(bg, 0, 0, W, H);
        ctx!.globalAlpha = 1;
      }

      // ground
      ctx!.fillStyle = "#B9C2CC";
      ctx!.fillRect(0, GROUND_Y + DOG_SIZE, W, 2);

      if (started && !s.dead) {
        s.frame++;
        s.vy += GRAVITY;
        s.dogY += s.vy;
        if (s.dogY > GROUND_Y - DOG_SIZE) {
          s.dogY = GROUND_Y - DOG_SIZE;
          s.vy = 0;
          s.jumping = false;
        }

        if (s.frame % Math.max(50 - Math.floor(s.speed * 2), 28) === 0) {
          const h = 20 + Math.random() * 18;
          s.obstacles.push({ x: W, w: 14 + Math.random() * 10, h });
        }

        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => o.x + o.w > 0);

        s.speed = Math.min(9, 4 + s.score / 12);
        s.score += 0.06;
        setScore(Math.floor(s.score));

        const dogBox = { x: DOG_X, y: s.dogY, w: DOG_SIZE, h: DOG_SIZE };
        for (const o of s.obstacles) {
          const oBox = { x: o.x, y: GROUND_Y - o.h + DOG_SIZE, w: o.w, h: o.h };
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

      // dog — el emoji mira a la izquierda por defecto, lo espejamos para que
      // parezca que corre HACIA los obstáculos (a la derecha).
      ctx!.save();
      ctx!.font = `${DOG_SIZE}px serif`;
      ctx!.textBaseline = "top";
      ctx!.translate(DOG_X + DOG_SIZE - 2, s.dogY - 2);
      ctx!.scale(-1, 1);
      ctx!.fillText("🐕", 0, 0);
      ctx!.restore();

      // obstacles
      ctx!.fillStyle = "#FF7A45";
      s.obstacles.forEach((o) => {
        const r = 4;
        const x = o.x;
        const y = GROUND_Y - o.h + DOG_SIZE;
        ctx!.beginPath();
        ctx!.roundRect(x, y, o.w, o.h, r);
        ctx!.fill();
      });

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
        <canvas ref={canvasRef} width={W} height={H} className={styles.canvas} />
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
