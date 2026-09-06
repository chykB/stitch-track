export default function AppPage() {
  return (
    <section className="workspace-card">
      <p className="eyebrow">
        Authenticated workspace
      </p>

      <h1>Workspace ready</h1>

      <p>
        Your StitchTrack session has been
        verified on the server.
      </p>

      <p className="workspace-note">
        Client, order, garment, measurement,
        fitting, and payment workflows are not
        introduced in V0.2.
      </p>
    </section>
  );
}
