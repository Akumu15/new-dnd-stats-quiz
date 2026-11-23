// Keeps the local save and the cloud in step, and publishes the hero's public card.
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import { loadHero, saveHero, watchHero, writeCard } from "./cloud.js";
import { buildSheet, dateKey, streak } from "./scoring.js";
import { weekKey } from "./progression.js";
import { bossFor, weekDamageFor } from "./party.js";

export function buildCard(save, today, memberCount = 1) {
  const sheet = buildSheet(save);
  const week = weekKey(today);
  const weakness = save.partyId ? bossFor(save.partyId, week, memberCount).weakness : null;
  return {
    name: (save.name || "Nameless Hero").slice(0, 40),
    level: Math.min(99, sheet.level),
    heroClass: sheet.heroClass,
    scores: sheet.scores,
    streak: streak(save.history || [], today),
    partyId: save.partyId || null,
    week,
    weekDamage: weekDamageFor(save.history, today, weakness),
    updatedAt: Date.now(),
  };
}

/**
 * @param save          current local save (or null)
 * @param replaceSave   set the save WITHOUT re-stamping updatedAt (for cloud → local)
 */
export function useCloud(save, replaceSave) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // initial merge done
  const [status, setStatus] = useState("idle"); // idle | syncing | saved | error
  const saveRef = useRef(save);
  saveRef.current = save;
  const lastSynced = useRef(0);
  const lastCard = useRef("");

  // Sign-in: merge local and cloud (the newer one wins), then mark ready.
  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setReady(false);
        lastCard.current = "";
        if (!u) return;
        try {
          setStatus("syncing");
          const cloud = await loadHero(u.uid);
          const local = saveRef.current;
          if (cloud?.save && (!local || (cloud.save.updatedAt || 0) > (local.updatedAt || 0))) {
            lastSynced.current = cloud.save.updatedAt || 0;
            replaceSave(cloud.save);
          } else if (local) {
            await saveHero(u.uid, local);
            lastSynced.current = local.updatedAt || 0;
          }
          setStatus("saved");
        } catch {
          setStatus("error");
        }
        setReady(true);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Changes made on another device.
  useEffect(() => {
    if (!user || !ready) return undefined;
    return watchHero(user.uid, (cloud) => {
      const remote = cloud?.save;
      if (remote && (remote.updatedAt || 0) > (saveRef.current?.updatedAt || 0)) {
        lastSynced.current = remote.updatedAt || 0;
        replaceSave(remote);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ready]);

  // Push local changes (debounced).
  useEffect(() => {
    if (!user || !ready || !save) return undefined;
    if ((save.updatedAt || 0) <= lastSynced.current) return undefined;
    setStatus("syncing");
    const t = setTimeout(async () => {
      try {
        await saveHero(user.uid, save);
        lastSynced.current = save.updatedAt || 0;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [user, ready, save]);

  return { user, ready, status };
}

/** Publish the public card whenever what it shows changes. */
export function useCardPublisher(user, ready, save, memberCount) {
  const last = useRef("");
  useEffect(() => {
    if (!user || !ready || !save) return undefined;
    const card = buildCard(save, dateKey(), memberCount);
    const { updatedAt, ...comparable } = card;
    const key = JSON.stringify(comparable);
    if (key === last.current) return undefined;
    const t = setTimeout(() => {
      writeCard(user.uid, card)
        .then(() => (last.current = key))
        .catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [user, ready, save, memberCount]);
}
