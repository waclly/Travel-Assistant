import React, { useState, useEffect } from "react";

type Preference = {
  travel_style?: string;
  budget_tier?: string;
  pace?: string;
  notes?: string;
};

type PlanRequest = {
  origin: string;
  destination: string;
  depart_time: string;
  trip_length_days: number;
  preferences?: Preference;
  language?: string;
};

type Poi = {
  name: string;
  category: string;
  address?: string | null;
  time_suggested_hours?: number | null;
  notes?: string | null;
  cost_estimate?: string | null;
  transport?: string | null;
};

type Meal = {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  reservation_needed?: boolean | null;
  notes?: string | null;
};

type DayPlan = {
  date: string;
  summary: string;
  schedule: string[];
  pois: Poi[];
  meals: Meal[];
  logistics?: string | null;
  tips?: string | null;
};

type PlanResponse = {
  destination: string;
  start_date: string;
  end_date: string;
  total_days: number;
  overview: string;
  daily: DayPlan[];
  packing_list: string[];
  budget_summary?: string | null;
  disclaimers?: string | null;
};

const API_BASE = "http://localhost:8000";

export default function App() {
  const STORAGE_KEY = "ai_travel_form";

  // 🧠 default form
  const [form, setForm] = useState<PlanRequest>({
    origin: "",
    destination: "",
    depart_time: "",
    trip_length_days: 4,
    preferences: {
      travel_style: "Food, culture, walking",
      budget_tier: "Mid",
      pace: "Normal",
      notes: "No beef",
    },
    language: "en",
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🧩 Load session record when page opens
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm(parsed);
        console.log("✅ Loaded previous session record");
      } catch (e) {
        console.warn("⚠️ Failed to parse session record", e);
      }
    }
  }, []);

  // 💾 Save to session whenever form changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const onChange = (k: keyof PlanRequest, v: any) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // convert date format YYYY/MM/DD → ISO
      const isoDate = new Date(form.depart_time).toISOString();
      const body = { ...form, depart_time: isoDate };

      const res = await fetch(`${API_BASE}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as PlanResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message || "Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🧭 AI Travel Planner</h1>
      <p className="muted">
        Enter your origin, destination, departure date, and preferences — Gemini
        will create a personalized itinerary.
      </p>

      <div className="card">
        <div className="grid">
          <div>
            <label>Origin</label>
            <input
              value={form.origin}
              onChange={(e) => onChange("origin", e.target.value)}
              placeholder="e.g. New York"
            />
          </div>

          <div>
            <label>Destination</label>
            <input
              value={form.destination}
              onChange={(e) => onChange("destination", e.target.value)}
              placeholder="e.g. Munich"
            />
          </div>

          {/* Departure Date */}
          <div>
            <label>Departure Date</label>
            <input
              type="text"
              placeholder="e.g. 2025/10/12"
              value={form.depart_time}
              onChange={(e) => onChange("depart_time", e.target.value)}
            />
            {/* <small className="muted">Enter date in format YYYY/MM/DD</small> */}
          </div>

          {/* Trip Length */}
          <div>
            <label>Trip Length (days)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={form.trip_length_days}
              onChange={(e) =>
                onChange("trip_length_days", Number(e.target.value))
              }
              placeholder="Enter number of days"
            />
          </div>
        </div>

        <details style={{ marginTop: 12 }}>
          <summary>Preferences (optional)</summary>
          <div className="grid" style={{ marginTop: 12 }}>
            <div>
              <label>Travel Style</label>
              <input
                value={form.preferences?.travel_style || ""}
                onChange={(e) =>
                  onChange("preferences", {
                    ...form.preferences,
                    travel_style: e.target.value,
                  })
                }
                placeholder="Food / culture / nature / shopping"
              />
            </div>

            <div>
              <label>Budget Level</label>
              <select
                value={form.preferences?.budget_tier || ""}
                onChange={(e) =>
                  onChange("preferences", {
                    ...form.preferences,
                    budget_tier: e.target.value,
                  })
                }
              >
                <option value="">-- select --</option>
                <option value="Budget">Budget</option>
                <option value="Mid">Mid</option>
                <option value="Luxury">Luxury</option>
              </select>
            </div>

            <div>
              <label>Pace</label>
              <select
                value={form.preferences?.pace || ""}
                onChange={(e) =>
                  onChange("preferences", {
                    ...form.preferences,
                    pace: e.target.value,
                  })
                }
              >
                <option value="">-- select --</option>
                <option value="Relaxed">Relaxed</option>
                <option value="Normal">Normal</option>
                <option value="Tight">Tight</option>
              </select>
            </div>

            <div>
              <label>Additional Notes</label>
              <textarea
                rows={1}
                value={form.preferences?.notes || ""}
                onChange={(e) =>
                  onChange("preferences", {
                    ...form.preferences,
                    notes: e.target.value,
                  })
                }
                placeholder="e.g. no beef, traveling with kids, want hot springs..."
              />
            </div>
          </div>
        </details>

        <div className="row" style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate Itinerary"}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: "#ef4444" }}>
          ❌ {error}
        </div>
      )}
      {loading && <div className="card loading">AI is generating your trip plan…</div>}

      {data && (
        <div className="card">
          <h2>{data.destination}</h2>
          <p className="muted">
            {data.start_date} → {data.end_date} ({data.total_days} days)
          </p>
          <p>{data.overview}</p>

          <h3>Daily Plans</h3>
          {data.daily.map((day) => (
            <div key={day.date} className="card day">
              <h4>{day.date}</h4>
              <p className="muted">{day.summary}</p>
              <ul>
                {day.schedule.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>

              <h5>Places</h5>
              <ul>
                {day.pois.map((p, i) => (
                  <li key={i}>
                    <strong>{p.name}</strong> – {p.category}
                  </li>
                ))}
              </ul>

              <h5>Meals</h5>
              <ul>
                {day.meals.map((m, i) => (
                  <li key={i}>
                    {m.type.toUpperCase()}: {m.name}
                  </li>
                ))}
              </ul>

              {day.logistics && (
                <p>
                  <strong>Logistics:</strong> {day.logistics}
                </p>
              )}
              {day.tips && (
                <p>
                  <strong>Tips:</strong> {day.tips}
                </p>
              )}
            </div>
          ))}

          <h3>Packing List</h3>
          <ul>
            {data.packing_list.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>

          {data.budget_summary && (
            <>
              <h3>Budget Summary</h3>
              <p>{data.budget_summary}</p>
            </>
          )}
          {data.disclaimers && (
            <>
              <h3>Notes</h3>
              <p className="muted">{data.disclaimers}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
