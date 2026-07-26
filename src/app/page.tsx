"use client";

import { useState } from "react";
import { CdDisc } from "@/components/cd-disc";
import { PlayerHome } from "@/components/player-home";

export default function Home() {
  const [mode, setMode] = useState<"home" | "disc">("home");

  if (mode === "disc") {
    return (
      <main className="disc-mode">
        <button
          type="button"
          className="disc-back"
          onClick={() => setMode("home")}
        >
          HOME
        </button>
        <CdDisc initialView="disc" />
      </main>
    );
  }

  return (
    <main className="player-shell">
      <PlayerHome onListen={() => setMode("disc")} />
    </main>
  );
}
