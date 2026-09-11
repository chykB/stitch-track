export function PortalUnavailable() {
  return (
    <main className="portal-shell">
      <section className="workspace-card portal-card">
        <p className="eyebrow">
          StitchTrack client portal
        </p>

        <h1>
          Link unavailable
        </h1>

        <p className="workspace-note">
          This portal link is unavailable.
          It may have expired, already been
          used, or no longer apply to the
          current order.
        </p>

        <p className="workspace-note">
          Please contact the business that
          sent you this link if you still
          need to take action.
        </p>
      </section>
    </main>
  );
}
