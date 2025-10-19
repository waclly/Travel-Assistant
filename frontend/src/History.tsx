import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Record = {
  id: number;
  origin: string;
  destination: string;
  depart_time: string;
  trip_length_days: number;
  created_at: string;
};

const API_BASE = "http://localhost:8000";

export default function History() {
  const [records, setRecords] = useState<Record[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    fetch(`${API_BASE}/history`)
      .then((res) => res.json())
      .then(setRecords)
      .catch((err) => setError(err.message));
  };

  const loadDetail = async (id: number) => {
    setLoading(true);
    setSelected(null);
    try {
      const res = await fetch(`${API_BASE}/history/${id}`);
      if (!res.ok) throw new Error("Failed to fetch record");
      const data = await res.json();
      setSelected(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚮 刪除紀錄
  const deleteRecord = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      setRecords((prev) => prev.filter((r) => r.id !== id)); // 即時更新畫面
      if (selected?.id === id) setSelected(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="container">
      <h1>🕓 Past Travel Records</h1>
      <p className="muted">View or delete your previous AI-generated travel plans.</p>

      {error && <div className="card" style={{ borderColor: "#ef4444" }}>❌ {error}</div>}

      <div className="grid">
        {records.map((r) => (
          <div key={r.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>
                {r.origin} → {r.destination}
              </h3>
              <button
                className="btn"
                style={{ background: "#ef4444", color: "white", fontSize: "13px", padding: "4px 8px" }}
                onClick={() => deleteRecord(r.id)}
              >
                Delete
              </button>
            </div>

            <p className="muted">
              {r.depart_time} | {r.trip_length_days} days
            </p>
            <small>Created: {new Date(r.created_at).toLocaleString()}</small>
            <div style={{ marginTop: "8px" }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: "13px", padding: "4px 8px" }}
                onClick={() => loadDetail(r.id)}
              >
                View Detail
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="card loading">Loading record details...</div>}

      {selected && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>{selected.destination}</h2>
          <p>{selected.overview}</p>

          <h3>Daily Plans</h3>
          {selected.daily.map((day: any, i: number) => (
            <div key={i} className="card day">
              <h4>{day.date}</h4>
              <p>{day.summary}</p>
              <ul>{day.schedule.map((s: string, j: number) => <li key={j}>{s}</li>)}</ul>
            </div>
          ))}

          <h3>Packing List</h3>
          <ul>{selected.packing_list.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>

          <Link
            to="/"
            className="btn btn-primary"
            style={{ marginTop: "15px", display: "inline-block" }}
          >
            Back to Planner
          </Link>

        </div>
      )}
    </div>
  );
}
