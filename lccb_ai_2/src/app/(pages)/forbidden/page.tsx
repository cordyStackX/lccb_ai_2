import Link from "next/link";

export default function ForbiddenPage() {
  return <main style={{ display: "grid", minHeight: "100dvh", placeItems: "center", padding: "2rem", textAlign: "center" }}>
    <section>
      <p style={{ margin: 0, color: "#1a54b8", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Error 403</p>
      <h1>Forbidden access</h1>
      <p>You do not have permission to access the admin area.</p>
      <Link href="/">Return home</Link>
    </section>
  </main>;
}
