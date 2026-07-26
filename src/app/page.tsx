"use client";

import { useState } from "react";
import { CdDisc } from "@/components/cd-disc";

export default function Home() {
  const [view, setView] = useState<"jacket" | "disc">("jacket");

  return (
    <main className="stage">
      <header className="brand">
        <p className="brand-name">OWN</p>
        <h1 className="brand-line">
          {view === "jacket"
            ? "ジャケットのまま、手に取る。"
            : "中の盤を、手のひらで回す。"}
        </h1>
        <p className="brand-support">
          デジタルでも、所有している感覚はそのままに。
        </p>
      </header>

      <div className="disc-stage">
        <CdDisc onViewChange={setView} />
      </div>

      <p className="hint">
        {view === "jacket"
          ? "タップで開く · ドラッグで回転"
          : "タップで戻す · ドラッグで回転"}
      </p>
    </main>
  );
}
