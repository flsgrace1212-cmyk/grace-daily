import { useState, useRef, useEffect } from "react";

const TABS = ["Today", "Backlog", "Ideas", "Shopping"];

const categoryColors = {
  morning: "#f4a261",
  afternoon: "#2a9d8f",
  evening: "#7b6cf6",
  anytime: "#e76f51",
};

const STORES = ["Costco", "Publix", "Aldi", "Home Depot", "Amazon", "Other"];

const STORE_COLORS = {
  Costco:     { bg: "rgba(0,83,159,0.18)",  border: "rgba(0,83,159,0.4)",  accent: "#4aacff", emoji: "🟦" },
  Publix:     { bg: "rgba(0,122,61,0.18)",  border: "rgba(0,122,61,0.4)",  accent: "#4ecf8a", emoji: "🟩" },
  Aldi:       { bg: "rgba(255,102,0,0.15)", border: "rgba(255,102,0,0.35)", accent: "#ff8c42", emoji: "🟧" },
  "Home Depot":{ bg: "rgba(242,106,35,0.15)",border: "rgba(242,106,35,0.35)",accent: "#f4a261", emoji: "🟠" },
  Amazon:     { bg: "rgba(255,153,0,0.12)", border: "rgba(255,153,0,0.3)", accent: "#ffc107", emoji: "📦" },
  Other:      { bg: "rgba(168,155,205,0.1)",border: "rgba(168,155,205,0.25)",accent: "#a89bcd", emoji: "🛒" },
};

const OVERLOAD_THRESHOLD = 6;

function Spinner({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#a89bcd", fontSize: 14, padding: "12px 0" }}>
      <div style={{
        width: 18, height: 18, border: "2px solid #3d2f6e", borderTop: "2px solid #a89bcd",
        borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0
      }} />
      {label || "Claude is thinking…"}
    </div>
  );
}

function TaskCard({ task, onRemove, onMoveToBacklog }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${task.calendarReminder ? "rgba(244,162,97,0.35)" : "rgba(255,255,255,0.09)"}`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 10,
      display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#f0ecff", fontWeight: 600, fontSize: 15, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {task.title || task.text}
          {task.repeated && (
            <span style={{ background: "#e76f51", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10 }}>
              mentioned before
            </span>
          )}
        </div>
        {task.tip && <div style={{ color: "#9b8fc0", fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>💡 {task.tip}</div>}
        {task.calendarReminder && (
          <div style={{ color: "#f4a261", fontSize: 12, lineHeight: 1.5, marginBottom: 4 }}>📅 Add to iCloud calendar</div>
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {task.time && (
            <div style={{
              display: "inline-block", background: categoryColors[task.slot] || "#3d2f6e",
              color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              padding: "2px 9px", borderRadius: 20, textTransform: "uppercase",
            }}>{task.time}</div>
          )}
          <button onClick={() => onMoveToBacklog(task)} style={{
            background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 20,
            color: "#7a6aaa", fontSize: 11, fontWeight: 600, padding: "2px 9px", cursor: "pointer",
          }}>→ backlog</button>
        </div>
      </div>
      <button onClick={() => onRemove(task.id)} style={{
        background: "none", border: "none", cursor: "pointer", color: "#5a4a8a",
        fontSize: 18, lineHeight: 1, padding: "2px 4px", borderRadius: 6,
      }}
        onMouseEnter={e => e.target.style.color = "#e76f51"}
        onMouseLeave={e => e.target.style.color = "#5a4a8a"}
      >×</button>
    </div>
  );
}

function BacklogItem({ item, onRemove, onMoveToToday }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10, padding: "10px 14px", marginBottom: 8,
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
    }}>
      <span style={{ color: "#c4b8e8", fontSize: 14, flex: 1 }}>
        {item.type === "idea" ? "💡" : "📌"} {item.text}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {onMoveToToday && (
          <button onClick={() => onMoveToToday(item)} style={{
            background: "rgba(123,108,246,0.15)", border: "none", borderRadius: 8,
            color: "#a89bcd", fontSize: 12, fontWeight: 600, padding: "4px 10px", cursor: "pointer",
          }}>+ today</button>
        )}
        <button onClick={() => onRemove(item.id)} style={{
          background: "none", border: "none", cursor: "pointer", color: "#5a4a8a", fontSize: 16, lineHeight: 1,
        }}
          onMouseEnter={e => e.target.style.color = "#e76f51"}
          onMouseLeave={e => e.target.style.color = "#5a4a8a"}
        >×</button>
      </div>
    </div>
  );
}

function ShoppingItem({ item, onRemove, onCheck }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px", marginBottom: 6,
      background: item.checked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9,
      opacity: item.checked ? 0.5 : 1, transition: "opacity 0.2s",
    }}>
      <button onClick={() => onCheck(item.id)} style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        background: item.checked ? "#7b6cf6" : "transparent",
        border: `2px solid ${item.checked ? "#7b6cf6" : "#4a3a7a"}`,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {item.checked && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
      </button>
      <span style={{
        flex: 1, color: "#c4b8e8", fontSize: 14,
        textDecoration: item.checked ? "line-through" : "none",
      }}>{item.name}</span>
      {item.autoAdded && (
        <span style={{ background: "rgba(42,157,143,0.2)", color: "#4ecf8a", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>
          auto
        </span>
      )}
      <button onClick={() => onRemove(item.id)} style={{
        background: "none", border: "none", cursor: "pointer", color: "#5a4a8a", fontSize: 15,
      }}
        onMouseEnter={e => e.target.style.color = "#e76f51"}
        onMouseLeave={e => e.target.style.color = "#5a4a8a"}
      >×</button>
    </div>
  );
}

function ListSummary({ backlog, ideas, shopping }) {
  const totalShopping = Object.values(shopping).flat().filter(i => !i.checked).length;
  if (backlog.length === 0 && ideas.length === 0 && totalShopping === 0) return null;
  return (
    <div style={{
      background: "rgba(123,108,246,0.08)", border: "1px solid rgba(123,108,246,0.2)",
      borderRadius: 12, padding: "14px 16px", marginBottom: 20,
    }}>
      <div style={{ color: "#a89bcd", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        👋 Welcome back — here's where things stand
      </div>
      {backlog.length > 0 && (
        <div style={{ color: "#c4b8e8", fontSize: 13, marginBottom: 4 }}>
          📌 <strong>{backlog.length}</strong> thing{backlog.length !== 1 ? "s" : ""} in your backlog
        </div>
      )}
      {ideas.length > 0 && (
        <div style={{ color: "#c4b8e8", fontSize: 13, marginBottom: 4 }}>
          💡 <strong>{ideas.length}</strong> idea{ideas.length !== 1 ? "s" : ""} saved for later
        </div>
      )}
      {totalShopping > 0 && (
        <div style={{ color: "#c4b8e8", fontSize: 13 }}>
          🛒 <strong>{totalShopping}</strong> item{totalShopping !== 1 ? "s" : ""} on your shopping lists
        </div>
      )}
    </div>
  );
}

const emptyShoppingLists = () => Object.fromEntries(STORES.map(s => [s, []]));

export default function App() {
  const [tab, setTab] = useState("Today");
  const [input, setInput] = useState("");
  const [todayTasks, setTodayTasks] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backlog, setBacklog] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [shopping, setShopping] = useState(emptyShoppingLists());
  const [activeStore, setActiveStore] = useState("Costco");
  const [quickInput, setQuickInput] = useState("");
  const [quickType, setQuickType] = useState("task");
  const [shopItemInput, setShopItemInput] = useState("");
  const [shopStore, setShopStore] = useState("Publix");
  const [error, setError] = useState("");
  const [overloadWarning, setOverloadWarning] = useState(false);
  const [newShopItems, setNewShopItems] = useState([]); // notification after plan
  const textareaRef = useRef(null);

  useEffect(() => {
    const s = localStorage.getItem("grace_planner_v3");
    if (s) {
      try {
        const d = JSON.parse(s);
        if (d.backlog) setBacklog(d.backlog);
        if (d.ideas) setIdeas(d.ideas);
        if (d.shopping) setShopping({ ...emptyShoppingLists(), ...d.shopping });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("grace_planner_v3", JSON.stringify({ backlog, ideas, shopping }));
  }, [backlog, ideas, shopping]);

  useEffect(() => {
    const lines = input.split("\n").filter(l => l.trim().length > 0);
    setOverloadWarning(lines.length >= OVERLOAD_THRESHOLD);
  }, [input]);

  function detectRepeats(tasks) {
    const backlogTexts = backlog.map(b => b.text.toLowerCase());
    return tasks.map(task => ({
      ...task,
      repeated: backlogTexts.some(b =>
        b.includes(task.title?.toLowerCase()) ||
        task.title?.toLowerCase().includes(b.split(" ")[0])
      )
    }));
  }

  function addShoppingItems(items) {
    // items: [{ name, store }]
    setShopping(prev => {
      const next = { ...prev };
      items.forEach(({ name, store }) => {
        const key = STORES.includes(store) ? store : "Other";
        if (!next[key]) next[key] = [];
        const already = next[key].some(i => i.name.toLowerCase() === name.toLowerCase());
        if (!already) {
          next[key] = [{ id: Date.now() + Math.random(), name, checked: false, autoAdded: true }, ...next[key]];
        }
      });
      return next;
    });
    setNewShopItems(items);
    setTimeout(() => setNewShopItems([]), 6000);
  }

  async function planDay() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setSchedule(null);
    setNewShopItems([]);

    const backlogContext = backlog.length > 0
      ? `\n\nAlready in backlog (don't re-add unless they want today): ${backlog.map(b => b.text).join(", ")}`
      : "";

    const prompt = `You are a warm, ADHD-friendly day planner. The user has listed things they want to do today.

Your job:
1. Organize into a realistic schedule — don't overload, keep buffer time
2. Suggest a specific time for each task
3. Add a brief helpful tip for tasks that need prep or context
4. Flag time-sensitive tasks needing a calendar block with calendarReminder: true
5. Detect any shopping items mentioned — infer the best store: Costco (bulk/wholesale), Publix (groceries), Aldi (budget groceries), Home Depot (hardware/home improvement), Amazon (online/delivery), Other (unclear)
6. If the list is too long, note it warmly in the closing

Respond ONLY with valid JSON — no markdown, no preamble:
{
  "greeting": "Warm one-sentence opener",
  "tasks": [
    {
      "id": "1",
      "title": "Task name",
      "time": "9:00 AM",
      "slot": "morning",
      "tip": "Helpful tip or empty string",
      "calendarReminder": false
    }
  ],
  "shoppingItems": [
    { "name": "Item name", "store": "Publix" }
  ],
  "closing": "Encouraging closing — if list is long, note it gently"
}

slot: morning | afternoon | evening | anytime
shoppingItems: only real purchasable items detected from the task list, empty array if none${backlogContext}

Today's tasks:
${input}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1400,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const tasksWithRepeats = detectRepeats(parsed.tasks || []);
      setSchedule(parsed);
      setTodayTasks(tasksWithRepeats);
      if (parsed.shoppingItems?.length > 0) {
        addShoppingItems(parsed.shoppingItems);
      }
    } catch (e) {
      setError("Something went wrong planning your day. Try again!");
    }
    setLoading(false);
  }

  function addQuick() {
    if (!quickInput.trim()) return;
    const item = { id: Date.now(), text: quickInput.trim(), type: quickType };
    if (quickType === "idea") setIdeas(prev => [item, ...prev]);
    else setBacklog(prev => [item, ...prev]);
    setQuickInput("");
  }

  function addShopItem() {
    if (!shopItemInput.trim()) return;
    const item = { id: Date.now(), name: shopItemInput.trim(), checked: false, autoAdded: false };
    setShopping(prev => ({ ...prev, [shopStore]: [item, ...prev[shopStore]] }));
    setShopItemInput("");
  }

  function checkShopItem(store, id) {
    setShopping(prev => ({
      ...prev,
      [store]: prev[store].map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    }));
  }

  function removeShopItem(store, id) {
    setShopping(prev => ({ ...prev, [store]: prev[store].filter(i => i.id !== id) }));
  }

  function clearChecked(store) {
    setShopping(prev => ({ ...prev, [store]: prev[store].filter(i => !i.checked) }));
  }

  function moveTaskToBacklog(task) {
    const item = { id: Date.now(), text: task.title, type: "task" };
    setBacklog(prev => [item, ...prev]);
    setTodayTasks(prev => prev.filter(t => t.id !== task.id));
  }

  function moveBacklogToToday(item) {
    setInput(prev => prev ? prev + "\n- " + item.text : "- " + item.text);
    setBacklog(prev => prev.filter(b => b.id !== item.id));
    setTab("Today");
  }

  function removeTask(id) { setTodayTasks(prev => prev.filter(t => t.id !== id)); }
  function removeBacklog(id) { setBacklog(prev => prev.filter(t => t.id !== id)); }
  function removeIdea(id) { setIdeas(prev => prev.filter(t => t.id !== id)); }

  const totalShopping = Object.values(shopping).flat().filter(i => !i.checked).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0a1e 0%, #1a0f35 50%, #0d1a2e 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "0 0 80px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        textarea:focus, input:focus, select:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3d2f6e; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "36px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{
          fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900,
          color: "#f0ecff", letterSpacing: "-0.01em", lineHeight: 1.1, marginBottom: 4,
        }}>My Planner</div>
        <div style={{ color: "#7a6aaa", fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: "14px 24px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? "rgba(168,155,205,0.15)" : "none",
            border: "none",
            borderBottom: tab === t ? "2px solid #a89bcd" : "2px solid transparent",
            color: tab === t ? "#f0ecff" : "#6a5a9a",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 13,
            padding: "7px 14px 9px", cursor: "pointer", borderRadius: "6px 6px 0 0",
            transition: "all 0.18s", whiteSpace: "nowrap",
          }}>
            {t}
            {t === "Backlog" && backlog.length > 0 && (
              <span style={{ marginLeft: 6, background: "#7b6cf6", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 10 }}>
                {backlog.length}
              </span>
            )}
            {t === "Ideas" && ideas.length > 0 && (
              <span style={{ marginLeft: 6, background: "#2a9d8f", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 10 }}>
                {ideas.length}
              </span>
            )}
            {t === "Shopping" && totalShopping > 0 && (
              <span style={{ marginLeft: 6, background: "#f4a261", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 10 }}>
                {totalShopping}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: "20px 24px" }}>

        {/* TODAY TAB */}
        {tab === "Today" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {!schedule ? (
              <>
                <ListSummary backlog={backlog} ideas={ideas} shopping={shopping} />
                <div style={{ color: "#9b8fc0", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
                  What do you want to get done today?
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={"Brain dump it all — one per line:\n- Call mom\n- Meal prep for the week\n- Pick up milk and eggs\n- Get lightbulbs from Home Depot\n- Hit the driving range"}
                  rows={7}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${overloadWarning ? "rgba(231,111,81,0.5)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 14, color: "#f0ecff", fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15, padding: "14px 16px", resize: "vertical", lineHeight: 1.7, transition: "border-color 0.2s",
                  }}
                />
                {overloadWarning && (
                  <div style={{
                    background: "rgba(231,111,81,0.1)", border: "1px solid rgba(231,111,81,0.3)",
                    borderRadius: 10, padding: "10px 14px", marginTop: 10,
                    color: "#f4a261", fontSize: 13, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
                  }}>
                    🧡 That's a lot for one day! Claude will help prioritize — or move some to your backlog first.
                  </div>
                )}
                <button onClick={planDay} disabled={!input.trim() || loading} style={{
                  marginTop: 12, width: "100%",
                  background: input.trim() && !loading ? "linear-gradient(135deg, #7b6cf6, #a89bcd)" : "rgba(255,255,255,0.06)",
                  border: "none", borderRadius: 12,
                  color: input.trim() && !loading ? "#fff" : "#5a4a8a",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15,
                  padding: "13px", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                  letterSpacing: "0.04em", transition: "all 0.2s",
                }}>
                  ✦ Plan My Day
                </button>
                {loading && <Spinner label="Claude is planning your day…" />}
                {error && <div style={{ color: "#e76f51", fontSize: 13, marginTop: 10 }}>{error}</div>}
              </>
            ) : (
              <>
                {/* Auto-added shopping notification */}
                {newShopItems.length > 0 && (
                  <div style={{
                    background: "rgba(42,157,143,0.12)", border: "1px solid rgba(42,157,143,0.3)",
                    borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                    animation: "slideIn 0.3s ease",
                  }}>
                    <div style={{ color: "#4ecf8a", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                      🛒 Added to Shopping Lists
                    </div>
                    {newShopItems.map((item, i) => (
                      <div key={i} style={{ color: "#c4b8e8", fontSize: 13 }}>
                        {item.name} → <strong>{item.store}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {schedule.greeting && (
                  <div style={{
                    fontFamily: "'Playfair Display', serif", fontSize: 16,
                    color: "#c4b8e8", marginBottom: 18, lineHeight: 1.5, fontStyle: "italic",
                  }}>"{schedule.greeting}"</div>
                )}

                {["morning", "afternoon", "evening", "anytime"].map(slot => {
                  const slotTasks = todayTasks.filter(t => t.slot === slot);
                  if (!slotTasks.length) return null;
                  return (
                    <div key={slot} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: categoryColors[slot] }} />
                        <span style={{
                          color: categoryColors[slot], fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 700, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                        }}>{slot}</span>
                      </div>
                      {slotTasks.map(task => (
                        <TaskCard key={task.id} task={task} onRemove={removeTask} onMoveToBacklog={moveTaskToBacklog} />
                      ))}
                    </div>
                  );
                })}

                {schedule.closing && (
                  <div style={{ color: "#7a6aaa", fontSize: 13, fontStyle: "italic", fontFamily: "'Playfair Display', serif", marginTop: 4, marginBottom: 18 }}>
                    {schedule.closing}
                  </div>
                )}

                <button onClick={() => { setSchedule(null); setTodayTasks([]); setNewShopItems([]); }} style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "#7a6aaa", fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, padding: "7px 14px", cursor: "pointer",
                }}>↩ Start over</button>
              </>
            )}
          </div>
        )}

        {/* BACKLOG TAB */}
        {tab === "Backlog" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ color: "#9b8fc0", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
              Things to do later
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <input value={quickInput} onChange={e => setQuickInput(e.target.value)}
                onKeyDown={e => { setQuickType("task"); if (e.key === "Enter") addQuick(); }}
                placeholder="Capture a future task…"
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0ecff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "10px 14px" }}
              />
              <button onClick={() => { setQuickType("task"); setTimeout(addQuick, 0); }} style={{
                background: "linear-gradient(135deg, #7b6cf6, #a89bcd)", border: "none", borderRadius: 10,
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, padding: "10px 14px", cursor: "pointer",
              }} onClickCapture={() => setQuickType("task")}>Add</button>
            </div>
            {backlog.length === 0
              ? <div style={{ color: "#4a3a7a", fontSize: 14, fontStyle: "italic" }}>Nothing here yet. Add tasks you want to get to eventually.</div>
              : backlog.map(item => <BacklogItem key={item.id} item={item} onRemove={removeBacklog} onMoveToToday={moveBacklogToToday} />)
            }
          </div>
        )}

        {/* IDEAS TAB */}
        {tab === "Ideas" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ color: "#9b8fc0", fontSize: 12, fontFamily: "'DM Sans', sans-serif", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
              Project ideas & someday list
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <input value={quickInput} onChange={e => setQuickInput(e.target.value)}
                onKeyDown={e => { setQuickType("idea"); if (e.key === "Enter") addQuick(); }}
                placeholder="Capture an idea before it disappears…"
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0ecff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "10px 14px" }}
              />
              <button onClick={() => { setQuickType("idea"); setTimeout(addQuick, 0); }} style={{
                background: "linear-gradient(135deg, #2a9d8f, #52c6b8)", border: "none", borderRadius: 10,
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, padding: "10px 14px", cursor: "pointer",
              }} onClickCapture={() => setQuickType("idea")}>Add</button>
            </div>
            {ideas.length === 0
              ? <div style={{ color: "#4a3a7a", fontSize: 14, fontStyle: "italic" }}>No ideas yet. Capture projects, DIY ideas, things to try someday.</div>
              : ideas.map(item => <BacklogItem key={item.id} item={{ ...item, type: "idea" }} onRemove={removeIdea} />)
            }
          </div>
        )}

        {/* SHOPPING TAB */}
        {tab === "Shopping" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {/* Add item bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              <input value={shopItemInput} onChange={e => setShopItemInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addShopItem()}
                placeholder="Add a shopping item…"
                style={{ flex: 1, minWidth: 140, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#f0ecff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "10px 14px" }}
              />
              <select value={shopStore} onChange={e => setShopStore(e.target.value)} style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, color: "#c4b8e8", fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: "10px 10px",
              }}>
                {STORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={addShopItem} style={{
                background: "linear-gradient(135deg, #f4a261, #e76f51)", border: "none", borderRadius: 10,
                color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, padding: "10px 14px", cursor: "pointer",
              }}>Add</button>
            </div>

            {/* Store tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {STORES.map(store => {
                const count = shopping[store]?.filter(i => !i.checked).length || 0;
                const sc = STORE_COLORS[store];
                return (
                  <button key={store} onClick={() => setActiveStore(store)} style={{
                    background: activeStore === store ? sc.bg : "rgba(255,255,255,0.03)",
                    border: `1px solid ${activeStore === store ? sc.border : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 20, padding: "5px 12px", cursor: "pointer",
                    color: activeStore === store ? sc.accent : "#6a5a9a",
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12,
                    transition: "all 0.18s", display: "flex", alignItems: "center", gap: 5,
                  }}>
                    {sc.emoji} {store}
                    {count > 0 && (
                      <span style={{ background: sc.accent, color: "#0f0a1e", fontSize: 10, fontWeight: 800, padding: "0px 5px", borderRadius: 8 }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active store list */}
            {(() => {
              const sc = STORE_COLORS[activeStore];
              const items = shopping[activeStore] || [];
              const checkedCount = items.filter(i => i.checked).length;
              return (
                <div style={{
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  borderRadius: 14, padding: "14px 14px 10px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ color: sc.accent, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13 }}>
                      {sc.emoji} {activeStore}
                    </span>
                    {checkedCount > 0 && (
                      <button onClick={() => clearChecked(activeStore)} style={{
                        background: "none", border: "none", color: "#5a4a8a",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer",
                      }}>Clear {checkedCount} checked</button>
                    )}
                  </div>
                  {items.length === 0
                    ? <div style={{ color: "#4a3a7a", fontSize: 14, fontStyle: "italic", paddingBottom: 4 }}>Nothing here yet.</div>
                    : items.map(item => (
                        <ShoppingItem key={item.id} item={item}
                          onCheck={(id) => checkShopItem(activeStore, id)}
                          onRemove={(id) => removeShopItem(activeStore, id)}
                        />
                      ))
                  }
                </div>
              );
            })()}
          </div>
        )}

      </div>

      {/* Quick capture bar — always visible */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(15,10,30,0.97)", borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "10px 16px", display: "flex", gap: 8, alignItems: "center",
      }}>
        <select value={quickType} onChange={e => setQuickType(e.target.value)} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, color: "#9b8fc0", fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "8px 6px",
        }}>
          <option value="task">📌 Later</option>
          <option value="idea">💡 Idea</option>
        </select>
        <input value={quickInput} onChange={e => setQuickInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addQuick(); }}
          placeholder="Quick capture — don't lose that thought…"
          style={{
            flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, color: "#f0ecff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "8px 12px",
          }}
        />
        <button onClick={addQuick} style={{
          background: "#7b6cf6", border: "none", borderRadius: 8, color: "#fff",
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13, padding: "8px 14px", cursor: "pointer",
        }}>Save</button>
      </div>
    </div>
  );
}