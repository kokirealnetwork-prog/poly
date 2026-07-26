import { CdDisc } from "@/components/cd-disc";

export default function Home() {
  return (
    <main className="stage">
      <header className="brand">
        <p className="brand-name">OWN</p>
        <h1 className="brand-line">あなたの盤を、手のひらで回す。</h1>
        <p className="brand-support">
          デジタルでも、所有している感覚はそのままに。
        </p>
      </header>

      <div className="disc-stage">
        <CdDisc />
      </div>

      <p className="hint">ドラッグ / スワイプで回転</p>
    </main>
  );
}
