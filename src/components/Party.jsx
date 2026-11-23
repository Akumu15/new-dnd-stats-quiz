import { useEffect, useMemo, useState } from "react";
import { ABILITIES } from "../data/gameData.js";
import { dateKey } from "../lib/scoring.js";
import { daysLeftInWeek, weekKey } from "../lib/progression.js";
import {
  createParty,
  joinParty,
  leaveParty,
  postFeed,
  renameParty,
  signInAsGuest,
  signInWithGoogle,
  signOutUser,
  watchCard,
  watchFeed,
  watchParty,
} from "../lib/cloud.js";
import { LOOT_XP, MAX_PARTY, bossFor, hasClaimedLoot, isValidCode, normalizeCode, partyDamage } from "../lib/party.js";
import { buildCard } from "../lib/useCloud.js";

const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("operation-not-allowed") || code.includes("admin-restricted")) return "Sign-in isn't switched on for this realm yet.";
  if (code.includes("popup-closed") || code.includes("cancelled-popup")) return "";
  if (code.includes("popup-blocked")) return "Your browser blocked the sign-in window. Allow pop-ups and try again.";
  if (code.includes("unauthorized-domain")) return "This website isn't authorized for sign-in yet.";
  if (code.includes("network")) return "No connection to the realm. Check your internet.";
  return err?.message || "Something went wrong.";
}

export default function Party({ save, cloud, updateSave, inviteCode, onMembers }) {
  if (!cloud.user) return <SignInPanel />;
  if (!cloud.ready) return <article className="parchment party-panel"><p className="panel-note">Consulting the archives…</p></article>;
  if (!save.partyId) return <FindParty save={save} user={cloud.user} updateSave={updateSave} inviteCode={inviteCode} />;
  return <PartyHall save={save} user={cloud.user} updateSave={updateSave} onMembers={onMembers} />;
}

// ── Not signed in ─────────────────────────────────────────────────────

function SignInPanel() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const run = (fn) => async () => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="parchment party-panel">
      <p className="kicker">❦ No hero should quest alone ❦</p>
      <h1 className="title-display small">Form a Party</h1>
      <p className="lead">
        Band together with up to {MAX_PARTY - 1} friends. Every quest you finish strikes this week's boss, and when it falls,
        everyone shares the spoils. Signing in also keeps your hero safe across devices.
      </p>
      <div className="foot-actions">
        <button className="btn-seal" onClick={run(signInWithGoogle)} disabled={busy}>Sign in with Google</button>
        <button className="btn-ink" onClick={run(signInAsGuest)} disabled={busy}>Continue as a guest</button>
      </div>
      <p className="fineprint">Guest heroes live on this device only. Sign in with Google later to keep them forever.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
    </article>
  );
}

// ── Signed in, no party ────────────────────────────────────────────────

function FindParty({ save, user, updateSave, inviteCode }) {
  const [name, setName] = useState(`${(save.name || "The Nameless").split(" ")[0]}'s Company`);
  const [code, setCode] = useState(inviteCode || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const enter = (partyCode) => updateSave((s) => ({ ...s, partyId: partyCode }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const newCode = await createParty(user.uid, name.trim() || "The Nameless Company");
      enter(newCode);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const join = async (e) => {
    e.preventDefault();
    const c = normalizeCode(code);
    if (!isValidCode(c)) return setError("Party codes are 6 letters and numbers.");
    setBusy(true);
    setError("");
    try {
      const joined = await joinParty(c, user.uid);
      enter(joined);
      postFeed(joined, { type: "join", fromUid: user.uid, fromName: save.name || "Nameless Hero" }).catch(() => {});
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="party-find">
      <article className="parchment party-panel">
        <h2 className="section-title">Join a Party</h2>
        <p className="panel-note">Got a code from a friend? Enter it here.</p>
        <form onSubmit={join} className="entry-row">
          <input
            className="code-input"
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            placeholder="ABC234"
            aria-label="Party code"
            autoComplete="off"
          />
          <button className="btn-seal" type="submit" disabled={busy}>Join</button>
        </form>
      </article>

      <div className="divider light" aria-hidden="true">or</div>

      <article className="parchment party-panel">
        <h2 className="section-title">Found a New Party</h2>
        <form onSubmit={create} className="trial-entry">
          <label htmlFor="party-name">Name your company</label>
          <div className="entry-row">
            <input id="party-name" className="name-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
            <button className="btn-seal" type="submit" disabled={busy}>Found it</button>
          </div>
        </form>
      </article>
      {error && <p className="form-error on-dark" role="alert">{error}</p>}
      <AccountLine user={user} />
    </div>
  );
}

// ── In a party ────────────────────────────────────────────────────────

function PartyHall({ save, user, updateSave, onMembers }) {
  const code = save.partyId;
  const today = dateKey();
  const week = weekKey(today);
  const [party, setParty] = useState(undefined); // undefined = loading, null = gone
  const [cards, setCards] = useState({});
  const [feed, setFeed] = useState([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => watchParty(code, setParty), [code]);
  useEffect(() => watchFeed(code, setFeed), [code]);

  const memberKey = party?.members?.join(",") || "";
  useEffect(() => {
    if (!memberKey) return undefined;
    const subs = memberKey.split(",").map((uid) => watchCard(uid, (card) => setCards((c) => ({ ...c, [uid]: card }))));
    return () => subs.forEach((unsub) => unsub());
  }, [memberKey]);

  // Removed from (or the party disbanded): fall back to the finder.
  useEffect(() => {
    if (party === null || (party && !party.members.includes(user.uid))) {
      updateSave((s) => ({ ...s, partyId: null }));
    }
  }, [party, user.uid, updateSave]);

  const members = party?.members || [];
  useEffect(() => {
    if (members.length) onMembers?.(members.length);
  }, [members.length, onMembers]);
  // Use this device's freshest numbers for yourself.
  const myCard = useMemo(() => buildCard(save, today, members.length), [save, today, members.length]);
  const allCards = members.map((uid) => (uid === user.uid ? myCard : cards[uid]));
  const boss = bossFor(code, week, members.length);
  const damage = partyDamage(allCards, week);
  const slain = damage >= boss.hp;
  const claimed = hasClaimedLoot(save, code, week);
  const daysLeft = daysLeftInWeek(today);
  const myName = save.name || "Nameless Hero";

  if (party === undefined) return <article className="parchment party-panel"><p className="panel-note">Gathering the party…</p></article>;
  if (!party) return null;

  const inviteLink = `${window.location.origin}${window.location.pathname}?join=${code}`;
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this invite link:", inviteLink);
    }
  };

  const claimLoot = () => {
    updateSave((s) =>
      hasClaimedLoot(s, code, week)
        ? s
        : {
            ...s,
            trophies: [...(s.trophies || []), { party: code, week, boss: boss.name }],
            history: [...s.history, { questId: `loot-${week}`, date: today, xp: LOOT_XP, stat: null, freq: "loot" }],
          }
    );
    // One "boss slain" entry per week (a fixed id, so the first member to claim writes it).
    postFeed(code, { type: "boss", fromUid: user.uid, fromName: myName, detail: boss.name }, `boss-${week}`).catch(() => {});
  };

  const rally = (uid, name) => {
    updateSave((s) => ({ ...s, rallies: { ...(s.rallies || {}), [uid]: today } }));
    postFeed(code, { type: "rally", fromUid: user.uid, fromName: myName, toUid: uid, toName: name }).catch(() =>
      setError("The rally didn't reach them. Try again.")
    );
  };

  const leave = async () => {
    if (!window.confirm(`Leave ${party.name}? You can rejoin with the code.`)) return;
    try {
      await postFeed(code, { type: "leave", fromUid: user.uid, fromName: myName }).catch(() => {});
      await leaveParty(code, user.uid);
      updateSave((s) => ({ ...s, partyId: null }));
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const rename = async () => {
    const next = window.prompt("Rename your company:", party.name);
    if (next && next.trim()) renameParty(code, next.trim()).catch((err) => setError(friendlyError(err)));
  };

  return (
    <div className="board party">
      <header className="board-head">
        <h1 className="board-title">{party.name}</h1>
        <p className="board-sub">
          {members.length} of {MAX_PARTY} heroes · Party code <strong className="party-code">{code}</strong>
        </p>
        <div className="foot-actions">
          <button className="btn-seal small" onClick={copyInvite}>{copied ? "Invite copied!" : "Copy invite link"}</button>
          {party.ownerUid === user.uid && <button className="btn-ink on-dark small" onClick={rename}>Rename</button>}
        </div>
      </header>

      {/* ── Boss ── */}
      <article className={slain ? "parchment boss slain" : "parchment boss"}>
        <p className="kicker">This week's foe · {slain ? "Defeated!" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}</p>
        <h2 className="boss-name">{boss.name}</h2>
        <p className="boss-flavor">{boss.flavor}</p>
        <div className="boss-bar" role="progressbar" aria-valuemin={0} aria-valuemax={boss.hp} aria-valuenow={Math.max(0, boss.hp - damage)}>
          <div className="boss-fill" style={{ width: `${Math.max(0, 100 - (damage / boss.hp) * 100)}%` }} />
          <span>{Math.max(0, boss.hp - damage)} / {boss.hp} HP</span>
        </div>
        <p className="boss-weak">
          Weak to <strong>{abilityByKey[boss.weakness].name}</strong>: {boss.weakness} quests deal double damage.
        </p>
        {slain && !claimed && (
          <button className="btn-seal" onClick={claimLoot}>Claim the spoils (+{LOOT_XP} XP)</button>
        )}
        {slain && claimed && <p className="stamp">Spoils claimed</p>}
        {!slain && <p className="fineprint">Every quest you claim strikes the boss. If it escapes on Sunday, nobody loses anything; it just gets away.</p>}
      </article>

      {/* ── Members ── */}
      <section className="quest-section">
        <div className="quest-section-head"><h2>The Company</h2><span>Damage this week</span></div>
        <ul className="members">
          {members.map((uid) => {
            const card = uid === user.uid ? myCard : cards[uid];
            const isMe = uid === user.uid;
            const ralliedToday = save.rallies?.[uid] === today;
            const dmg = card && card.week === week ? card.weekDamage : 0;
            return (
              <li key={uid} className="parchment member">
                <div className="member-head">
                  <div>
                    <div className="member-name">{card?.name || "A distant hero"}{isMe && <span className="you"> (you)</span>}</div>
                    <div className="member-class">{card ? `Level ${card.level} ${card.heroClass}` : "Card not yet shared"}</div>
                  </div>
                  <div className="member-dmg"><strong>{dmg}</strong><span>dmg</span></div>
                </div>
                {card && (
                  <div className="member-scores">
                    {ABILITIES.map((a) => (
                      <span key={a.key} className={a.key === boss.weakness ? "weak" : undefined}>
                        <small>{a.key}</small>{card.scores?.[a.key] ?? "–"}
                      </span>
                    ))}
                  </div>
                )}
                <div className="member-foot">
                  <span>🔥 {card?.streak ?? 0} day streak</span>
                  {!isMe && (
                    <button className="link-ink" disabled={ralliedToday} onClick={() => rally(uid, card?.name || "a hero")}>
                      {ralliedToday ? "Rallied today" : "⚑ Rally"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Chronicle ── */}
      <article className="parchment chronicle">
        <h2 className="section-title">Party Chronicle</h2>
        {feed.length === 0 ? (
          <p className="panel-note">No tales yet. Share the invite link and begin your saga.</p>
        ) : (
          <ul>
            {feed.map((f) => (
              <li key={f.id} className={f.type === "rally" && f.toUid === user.uid ? "to-me" : undefined}>
                <span className="log-date">{f.createdAt?.toDate ? f.createdAt.toDate().toLocaleDateString() : "now"}</span>
                <span>{feedText(f, user.uid)}</span>
              </li>
            ))}
          </ul>
        )}
      </article>

      {error && <p className="form-error on-dark" role="alert">{error}</p>}
      <div className="foot-actions party-actions">
        <button className="btn-ink on-dark ghost" onClick={leave}>Leave the party</button>
      </div>
      <AccountLine user={user} />
    </div>
  );
}

export function feedText(f, myUid) {
  const from = f.fromUid === myUid ? "You" : f.fromName;
  switch (f.type) {
    case "rally":
      return f.toUid === myUid ? `⚑ ${f.fromName} rallies you to action!` : `⚑ ${from} rallied ${f.toName}.`;
    case "join":
      return `${from} joined the company.`;
    case "leave":
      return `${from} left the company.`;
    case "boss":
      return `⚔ The company slew ${f.detail}! (first strike claimed by ${f.fromName})`;
    case "trial":
      return `${from} faced a Trial: ${f.detail}.`;
    case "level":
      return `★ ${from} reached level ${f.detail}!`;
    default:
      return "";
  }
}

function AccountLine({ user }) {
  return (
    <p className="account-line">
      {user.isAnonymous ? "Playing as a guest" : `Signed in as ${user.displayName || user.email || "a hero"}`}
      {user.isAnonymous && (
        <>
          {" · "}
          <button className="link-ink on-dark" onClick={() => signInWithGoogle().catch(() => {})}>Keep forever with Google</button>
        </>
      )}
      {" · "}
      <button className="link-ink on-dark" onClick={() => signOutUser()}>Sign out</button>
    </p>
  );
}
