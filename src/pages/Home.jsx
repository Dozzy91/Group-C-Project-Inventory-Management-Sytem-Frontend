import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    title: "One shelf, many stores",
    body: "Run every store you own from a single ledger. Switch between them without losing track of what's where.",
  },
  {
    title: "Retrieve in batches",
    body: "Pull several items out for an order in one go. Stock levels update instantly, and every batch is checked against what's actually on the shelf before it's approved.",
  },
  {
    title: "A paper trail that keeps itself",
    body: "Every retrieval is logged automatically, what was taken, when, and from which store. So you're never guessing where stock went.",
  },
  {
    title: "Built for the whole team",
    body: "Tables reflow into cards on a phone, so whoever's on the shop floor can check stock without squinting at a spreadsheet.",
  },
];

export default function Home() {
  const { session } = useAuth();
  const location = useLocation();
  const sessionExpired = location.state?.sessionExpired;

  return (
    <div className="landing">
      {sessionExpired && (
        <div className="session-expired-banner">
          Session expired. Please sign in again.
        </div>
      )}

      <section className="landing-hero">
        <span className="eyebrow">Inventory, kept honestly</span>
        <h1>Stockroom keeps your shelves and ledger in the same place.</h1>
        <p className="landing-lede">
          A no-nonsense inventory ledger for shop owners running one store or several,
          track what you have, watch it move, and know exactly where it went.
        </p>
        <div className="landing-cta">
          {session ? (
            <Link to="/stores" className="btn btn-amber btn-lg">
              Go to your stores
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-amber btn-lg">
                Get started
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="landing-features">
        {features.map((f) => (
          <div className="landing-feature card" key={f.title}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="landing-split">
        <div className="landing-split-panel">
          <span className="eyebrow">Our mission</span>
          <h2>Make stock as easy to trust as it is to count.</h2>
          <p>
            Too many small shops are still tracking inventory on paper or in
            spreadsheets that fall out of date the moment stock moves. Stockroom
            exists to close that gap, a ledger that updates itself the moment
            something leaves the shelf, so the numbers you see are the numbers
            that are actually there.
          </p>
        </div>
        <div className="landing-split-panel">
          <span className="eyebrow">Our vision</span>
          <h2>Every shop owner, in full control of what they own.</h2>
          <p>
            We want independent shop owners and small retail teams to spend
            less time reconciling stock and more time running their business
            with a record of every retrieval they can hand to anyone and trust.
          </p>
        </div>
      </section>

      <section className="landing-gain">
        <span className="eyebrow">What you get</span>
        <h2>Everything you need to keep a shelf honest</h2>
        <ul className="landing-gain-list">
          <li>Create and manage multiple stores under one account</li>
          <li>Add, edit, and price items with running quantity totals</li>
          <li>Retrieve multiple items at once, checked against live stock</li>
          <li>A searchable retrieval history for every store</li>
          <li>A live total of stock value and units on hand, per store</li>
          <li>Works on a laptop at the counter or a phone in the stockroom</li>
        </ul>
      </section>

      <section className="landing-footer-cta">
        <h2>Ready to see what's actually on your shelves?</h2>
        <div className="landing-cta">
          {session ? (
            <Link to="/stores" className="btn btn-amber btn-lg">
              Go to your stores
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-amber btn-lg">
                Get started
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg">
                Sign in
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
