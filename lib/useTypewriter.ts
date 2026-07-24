import { useEffect, useState } from "react";

export interface TypewriterPrompt {
  text: string;
  holdMs: number;
}

type TypingPhase = "typing" | "holding" | "erasing";

const TYPE_MS = 36;
const ERASE_MS = 14;
const LOOP_DELAY_MS = 180;

export function useTypewriter(prompts: TypewriterPrompt[]) {
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase] = useState<TypingPhase>("typing");
  const [promptIdx, setPromptIdx] = useState(0);
  const [charPos, setCharPos] = useState(0);

  useEffect(() => {
    const current = prompts[promptIdx];
    let id: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (charPos < current.text.length) {
        id = setTimeout(() => {
          setTypedText(current.text.slice(0, charPos + 1));
          setCharPos((c) => c + 1);
        }, TYPE_MS);
      } else {
        id = setTimeout(() => setPhase("holding"), 80);
      }
    } else if (phase === "holding") {
      id = setTimeout(() => setPhase("erasing"), current.holdMs);
    } else {
      if (charPos > 0) {
        id = setTimeout(() => {
          setCharPos((c) => c - 1);
          setTypedText(current.text.slice(0, charPos - 1));
        }, ERASE_MS);
      } else {
        id = setTimeout(() => {
          setPromptIdx((i) => (i + 1) % prompts.length);
          setPhase("typing");
        }, LOOP_DELAY_MS);
      }
    }

    return () => clearTimeout(id);
  }, [phase, charPos, promptIdx, prompts]);

  return { text: typedText, phase, promptIndex: promptIdx };
}
