import { useState } from "react";
import { renderShareCard, shareUrl } from "../lib/share.js";

// Share the hero: an image card (native share sheet on phones, download elsewhere) and a link.
export default function ShareBar({ name, level, scores, heroClass, background }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const hero = { name, level, scores, heroClass, background };
  const fileName = `${(name || "hero").replace(/[^\w-]+/g, "-").toLowerCase()}-character-sheet.png`;

  const shareImage = async () => {
    setBusy(true);
    setStatus("");
    try {
      const blob = await renderShareCard(hero);
      if (!blob) throw new Error("no image");
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My real-life character sheet", text: shareUrl(hero) });
        setStatus("Shared!");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setStatus("Image saved. Post it anywhere.");
      }
    } catch (err) {
      if (err?.name !== "AbortError") setStatus("Couldn't create the image. Try copying the link instead.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const url = shareUrl(hero);
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied. Anyone who opens it sees your stats.");
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <div className="share-bar">
      <span className="share-label">Show the realm who you are</span>
      <div className="foot-actions">
        <button className="btn-ink" onClick={shareImage} disabled={busy}>{busy ? "Inking…" : "Share image"}</button>
        <button className="btn-ink" onClick={copyLink}>Copy link</button>
      </div>
      {status && <p className="fineprint" role="status">{status}</p>}
    </div>
  );
}
