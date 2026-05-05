const featureCards = [
  "JWT auth with access and refresh tokens",
  "Post CRUD with comments and likes",
  "Friend relationships between users",
  "Realtime chat planned after the core social graph",
];

export default function HomePage() {
  return (
    <main>
      <section>
        <p>Phase 0</p>
        <h1>Social media clone workspace</h1>
        <p>
          This repository starts with architecture, schema, and test strategy before feature
          implementation.
        </p>
      </section>

      <section aria-label="Planned features">
        <ul>
          {featureCards.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
