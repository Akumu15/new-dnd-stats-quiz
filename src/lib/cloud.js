// All Firestore / Auth calls live here, so components stay simple.
import {
  GoogleAuthProvider,
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";
import { generatePartyCode, normalizeCode } from "./party.js";

// Firestore rejects `undefined`; a JSON round-trip drops it.
const clean = (obj) => JSON.parse(JSON.stringify(obj));

// ── Auth ───────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  // A guest who signs in with Google keeps their progress (the account is upgraded).
  if (auth.currentUser?.isAnonymous) {
    try {
      return await linkWithPopup(auth.currentUser, provider);
    } catch (err) {
      if (err?.code !== "auth/credential-already-in-use") throw err;
      // That Google account already exists: switch to it instead.
    }
  }
  return signInWithPopup(auth, provider);
}

export const signInAsGuest = () => signInAnonymously(auth);
export const signOutUser = () => signOut(auth);

// ── Private save ───────────────────────────────────────────────────────

export async function loadHero(uid) {
  const snap = await getDoc(doc(db, "heroes", uid));
  return snap.exists() ? snap.data() : null;
}

export function saveHero(uid, save) {
  return setDoc(doc(db, "heroes", uid), { save: clean(save), updatedAt: save.updatedAt || Date.now() });
}

export function watchHero(uid, onChange) {
  return onSnapshot(doc(db, "heroes", uid), (snap) => onChange(snap.exists() ? snap.data() : null), () => {});
}

// ── Public card ────────────────────────────────────────────────────────

export function writeCard(uid, card) {
  return setDoc(doc(db, "cards", uid), clean(card));
}

export function watchCard(uid, onChange) {
  return onSnapshot(doc(db, "cards", uid), (snap) => onChange(snap.exists() ? snap.data() : null), () => onChange(null));
}

// ── Parties ────────────────────────────────────────────────────────────

export async function createParty(uid, name) {
  // Codes are random; if one is taken the write is rejected as an update, so try another.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePartyCode();
    try {
      await setDoc(doc(db, "parties", code), {
        name: name.slice(0, 40),
        ownerUid: uid,
        members: [uid],
        createdAt: serverTimestamp(),
      });
      return code;
    } catch (err) {
      if (err?.code !== "permission-denied") throw err;
    }
  }
  throw new Error("Couldn't create a party. Please try again.");
}

export async function fetchParty(code) {
  const snap = await getDoc(doc(db, "parties", normalizeCode(code)));
  return snap.exists() ? { code: snap.id, ...snap.data() } : null;
}

export async function joinParty(code, uid) {
  const party = await fetchParty(code);
  if (!party) throw new Error("No party has that code.");
  if (party.members.includes(uid)) return party.code;
  if (party.members.length >= 6) throw new Error("That party is full (6 heroes).");
  await updateDoc(doc(db, "parties", party.code), { members: arrayUnion(uid) });
  return party.code;
}

export async function leaveParty(code, uid) {
  const party = await fetchParty(code);
  if (!party || !party.members.includes(uid)) return;
  if (party.members.length === 1) await deleteDoc(doc(db, "parties", party.code));
  else await updateDoc(doc(db, "parties", party.code), { members: arrayRemove(uid) });
}

export function renameParty(code, name) {
  return updateDoc(doc(db, "parties", code), { name: name.slice(0, 40) });
}

export function watchParty(code, onChange) {
  return onSnapshot(
    doc(db, "parties", code),
    (snap) => onChange(snap.exists() ? { code: snap.id, ...snap.data() } : null),
    () => onChange(null)
  );
}

// ── Party chronicle ────────────────────────────────────────────────────

export function postFeed(code, entry, id) {
  const data = clean({ ...entry, createdAt: null });
  data.createdAt = serverTimestamp();
  return id ? setDoc(doc(db, "parties", code, "feed", id), data) : addDoc(collection(db, "parties", code, "feed"), data);
}

export function watchFeed(code, onChange) {
  const q = query(collection(db, "parties", code, "feed"), orderBy("createdAt", "desc"), limit(30));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => onChange([])
  );
}
