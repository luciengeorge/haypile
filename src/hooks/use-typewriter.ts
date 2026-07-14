import { useEffect, useState } from "react";

type TypewriterOptions = {
  typeMs?: number;
  deleteMs?: number;
  pauseMs?: number;
};

type TypewriterPhase = "typing" | "pausing" | "deleting";

// Returns the currently-typed substring plus the index of the phrase it belongs to,
// so callers can swap related content (e.g. search results) in step with the query.
export function useTypewriter(phrases: string[], opts: TypewriterOptions = {}) {
  const firstPhrase = phrases[0] ?? "";
  const [text, setText] = useState(firstPhrase);
  const [index, setIndex] = useState(0);
  const typeMs = opts.typeMs ?? 55;
  const deleteMs = opts.deleteMs ?? 30;
  const pauseMs = opts.pauseMs ?? 1400;

  useEffect(() => {
    if (!phrases.length) {
      setText("");
      setIndex(0);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setText(firstPhrase);
      setIndex(0);
      return;
    }

    let timer: number | null = null;
    let phraseIndex = 0;
    let charIndex = firstPhrase.length;
    let phase: TypewriterPhase = "pausing";

    const schedule = (delay: number) => {
      timer = window.setTimeout(tick, delay);
    };

    const tick = () => {
      if (phase === "pausing") {
        phase = "deleting";
        schedule(deleteMs);
        return;
      }

      if (phase === "deleting") {
        const phrase = phrases[phraseIndex] ?? "";
        if (charIndex > 0) {
          charIndex -= 1;
          setText(phrase.slice(0, charIndex));
          schedule(deleteMs);
          return;
        }

        phraseIndex = (phraseIndex + 1) % phrases.length;
        setIndex(phraseIndex);
        phase = "typing";
        schedule(typeMs);
        return;
      }

      const nextPhrase = phrases[phraseIndex] ?? "";
      if (charIndex < nextPhrase.length) {
        charIndex += 1;
        setText(nextPhrase.slice(0, charIndex));
        schedule(typeMs);
        return;
      }

      phase = "pausing";
      schedule(pauseMs);
    };

    setText(firstPhrase);
    setIndex(0);
    schedule(pauseMs);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [deleteMs, firstPhrase, pauseMs, phrases, typeMs]);

  return { text, index };
}
