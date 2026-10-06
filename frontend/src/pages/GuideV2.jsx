import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { Page } from "../components/UI";
import { useWild } from "../components/Context";
import { monthPacking, MONTHS, rankTreks } from "../services/adventure";
import { guideReply } from "../services/guide";
const welcome = {
  role: "guide",
  text: "Hey, explorer. Tell me a trail you’re curious about, or ask me to find one. I can help with permits, seasons, packing and altitude preparation — and remember what we discuss.",
};
export default function Guide() {
  const { treks, profile } = useWild();
  const [input, setInput] = useState(""),
    [memory, setMemory] = useState(() => {
      try {
        return (
          JSON.parse(sessionStorage.getItem("wildroot-guide") || "null") || {
            messages: [welcome],
            trek: null,
            month: 12,
          }
        );
      } catch {
        return { messages: [welcome], trek: null, month: 12 };
      }
    });
  const end = useRef();
  useEffect(() => {
    sessionStorage.setItem("wildroot-guide", JSON.stringify(memory));
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [memory]);
  function send(q) {
    if (!q.trim()) return;
    const { text, month, trek } = guideReply(treks, profile, memory, q);
    setMemory({
      month,
      trek,
      messages: [
        ...memory.messages,
        { role: "you", text: q },
        { role: "guide", text },
      ].slice(-60),
    });
    setInput("");
  }
  const t = treks.find((t) => t.id === memory.trek);
  return (
    <Page
      eyebrow="WILDGUIDE / YOUR TRAIL COMPANION"
      title="Good questions. Better adventures."
      description="A built-in trail knowledge assistant with conversation memory."
    >
      <div className="guide-layout">
        <aside className="panel guide-context">
          <Sparkles size={28} />
          <h3>Your conversation compass</h3>
          <div className="guide-memory">
            <small>CURRENT TRAIL</small>
            <b>{t?.name || "Still exploring"}</b>
            <small>TRAVEL MONTH</small>
            <b>{MONTHS[memory.month - 1]}</b>
            <small>YOUR FITNESS</small>
            <b>{profile.fitness}%</b>
          </div>
          <p>
            Follow-up questions stay connected to the trail and month you
            mention.
          </p>
          <button
            className="text-link inline"
            onClick={() =>
              setMemory({ messages: [welcome], trek: null, month: 12 })
            }
          >
            <Trash2 size={15} />
            Start a fresh conversation
          </button>
        </aside>
        <div className="chat panel">
          <div className="chat-top">
            <div>
              <Sparkles size={19} />
              <b>WildGuide</b>
              <span>Trail knowledge engine</span>
            </div>
            <small>Memory on</small>
          </div>
          <div className="chat-messages" aria-live="polite">
            {memory.messages.map((m, i) => (
              <div className={"message " + m.role} key={i}>
                <small>{m.role === "guide" ? "WildGuide" : "You"}</small>
                <p>{m.text}</p>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="suggestions">
            {[
              "Find me a beginner trek in December",
              "What permits do I need?",
              "What is the best season?",
              "What should I pack?",
            ].map((q) => (
              <button key={q} onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              aria-label="Message the guide"
              placeholder="Ask about trails, seasons, permits or altitude…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength="500"
            />
            <button
              className="button lime small"
              disabled={!input.trim()}
              aria-label="Send question"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </Page>
  );
}
