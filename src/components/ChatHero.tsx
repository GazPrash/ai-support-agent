/**
 * Renders the marketing-style intro panel beside the live chat.
 */
export function ChatHero() {
  return (
    <section className="hero-panel">
      <p className="eyebrow">pShr's Live Agent Support</p>
      <h1>Shipping updates or doubts, whatever it is we're here to help!</h1>
      <p className="hero-copy">
        We help customers track packages, understand delivery windows, check
        shipping options, and resolve order questions quickly. Ask the agent
        anything from a late parcel to a return label and get a clear next step.
      </p>

      <div className="feature-grid">
        <article className="feature-card">
          <span>Track Orders</span>
          <p>
            Get help checking shipment status, transit progress, and delivery
            updates.
          </p>
        </article>
        <article className="feature-card">
          <span>Delivery Help</span>
          <p>
            Understand ETAs, delays, address changes, and options for
            rescheduling.
          </p>
        </article>
        <article className="feature-card">
          <span>Returns & Claims</span>
          <p>
            Start a return, ask about damaged goods, or get the right next step
            fast.
          </p>
        </article>
      </div>
    </section>
  );
}
