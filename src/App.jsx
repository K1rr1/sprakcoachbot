import { useState } from "react";
import { askCoach } from "./langchain/coach";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("qa"); // "qa" | "plan" för fråge-läge eller studieplans-läge
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // { role, text, sources? }
  const [loading, setLoading] = useState(false);

  async function onSend(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await askCoach({ mode, input: trimmed });
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: res.answer, sources: res.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Något gick fel. Kontrollera Ollama och Supabase-inställningar." },
      ]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Språkcoachboten – Språkverkstan AB</h1>

      <div className="modeBox">
        <label>
          <input
            type="radio"
            name="mode"
            value="qa"
            checked={mode === "qa"}
            onChange={() => setMode("qa")}
          />
          Ställ en fråga
        </label>

        <label>
          <input
            type="radio"
            name="mode"
            value="plan"
            checked={mode === "plan"}
            onChange={() => setMode("plan")}
          />
          Generera studieplan
        </label>
      </div>

      <div className="chat">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "msg user" : "msg bot"}>
            <div className="role">{m.role === "user" ? "Du" : "Språkcoach"}</div>
            <div className="text" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>

            {m.role === "bot" && m.sources?.length > 0 && (
              <details className="sources">
                <summary>Källor (från Supabase)</summary>
                <ul>
                  {m.sources.map((s, i) => (
                    <li key={i}>
                      <strong>{s.source}:</strong> {s.snippet}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={onSend} className="inputRow">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "plan" ? "Ex: Jag har 3 månader och vill fokusera på affärsengelska..." : "Skriv din fråga..."}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Tänker..." : "Skicka"}
        </button>
      </form>
    </div>
  );
}
