import { Dodecahedron } from "@/components/dodecahedron";

export default function Home() {
  return (
    <main
      className="stage"
      style={{
        background:
          "radial-gradient(circle at 25% 15%, rgb(237 231 255 / 65%), transparent 42%), linear-gradient(145deg, #fff 0%, #faf8ff 55%, #fff 100%)",
      }}
    >
      <Dodecahedron />
    </main>
  );
}
