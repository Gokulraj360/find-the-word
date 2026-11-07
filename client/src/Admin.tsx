import React, { useState, useEffect } from "react";

interface Submission {
  id: number;
  entityName: string;
  category?: "character" | "object";
  questionText: string;
  answer: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface EntityItem {
  id: number;
  name: string;
  category?: "character" | "object";
  description: string | null;
  popularity: number;
  status: string;
}

interface QuestionItem {
  id: number;
  text: string;
  category?: "character" | "object" | "common";
  qualityScore: number;
  timesAsked: number;
  isActive: boolean;
}

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("cognitor_admin_token"));
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      localStorage.setItem("cognitor_admin_token", data.token);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("cognitor_admin_token");
  };

  const fetchSubmissions = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setSubmissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEntities = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/entities", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/admin/questions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllAdminData = async () => {
    if (!token) return;
    setLoading(true);
    await Promise.all([fetchSubmissions(), fetchEntities(), fetchQuestions()]);
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadAllAdminData();
    }
  }, [token]);

  const handleApprove = async (id: number) => {
    try {
      setStatusMsg("Approving and updating probability matrix...");
      const res = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg(data.message);
      fetchSubmissions();
      fetchEntities();
      fetchQuestions();
    } catch (err: any) {
      alert("Error approving submission: " + err.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg(data.message);
      fetchSubmissions();
    } catch (err: any) {
      alert("Error rejecting submission: " + err.message);
    }
  };

  const handleReloadCache = async () => {
    try {
      setStatusMsg("Hot-reloading in-memory matrix...");
      const res = await fetch("/api/admin/reload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStatusMsg(`Matrix reloaded: ${data.entitiesCount} entities, ${data.questionsCount} questions.`);
      loadAllAdminData();
    } catch (err: any) {
      alert("Reload error: " + err.message);
    }
  };

  if (!token) {
    return (
      <div className="card cyber-modal-card" style={{ maxWidth: 420, margin: "3rem auto" }}>
        <h2 className="cyber-title" style={{ marginBottom: "1rem" }}>/admin Login</h2>
        {loginError && <p style={{ color: "var(--accent-rose)", marginBottom: "1rem" }}>{loginError}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Access Key</label>
            <input
              type="password"
              className="form-input cyber-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-cyan-glow" style={{ flex: 1 }}>
              Authenticate
            </button>
            <button type="button" className="btn" onClick={onBack}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  const filteredEntities = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(
    (s) =>
      s.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.questionText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-page-container">
      {/* HEADER SECTION: /admin WITH HOT-RELOAD */}
      <div className="admin-top-bar">
        <div className="admin-title-group">
          <h1 className="admin-heading">/admin</h1>
        </div>

        <div className="admin-actions-group">
          <button className="hot-reload-btn" onClick={handleReloadCache} title="Hot-reload Bayesian Float32Array matrix">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
            </svg>
            <span>Hot-Reload</span>
          </button>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}>
            Logout
          </button>
          <button className="btn" onClick={onBack} style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}>
            Back to Game
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="admin-status-toast">
          {statusMsg}
        </div>
      )}

      {/* 3-CARD SIDE-BY-SIDE CYBER GRID */}
      <div className="admin-cards-grid">
        {/* CARD 1: ENTITY MANAGEMENT TABLE */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              Entity Management Table ({entities.length})
            </h3>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-spec-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>ID</th>
                  <th>Name / Entity</th>
                  <th>Parts</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntities.slice(0, 15).map((e, idx) => (
                  <tr key={e.id}>
                    <td>
                      <span className={`admin-status-pill ${idx % 2 === 0 ? "pill-cyan" : "pill-amber"}`}>
                        {idx % 2 === 0 ? "Active" : "Bronze"}
                      </span>
                    </td>
                    <td className="mono-id">1034{e.id}</td>
                    <td className="entity-name-cell">{e.name}</td>
                    <td>
                      <div className="admin-mini-bar">
                        <div className="mini-bar-fill" style={{ width: `${Math.min(100, Math.round(e.popularity * 10))}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD 2: PROBABILITY MATRIX EXPLORER */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              Probability Matrix Explorer ({questions.length} Questions)
            </h3>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-spec-table">
              <thead>
                <tr>
                  <th>Question ID</th>
                  <th>Details</th>
                  <th>Difficulty</th>
                  <th>Probability Weight</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.slice(0, 15).map((q, idx) => (
                  <tr key={q.id}>
                    <td className="mono-id">{q.id}</td>
                    <td className="q-text-cell" title={q.text}>
                      {q.text.length > 32 ? `${q.text.slice(0, 32)}...` : q.text}
                    </td>
                    <td>
                      <span className={`admin-diff-pill ${idx % 2 === 0 ? "diff-high" : "diff-med"}`}>
                        {idx % 2 === 0 ? "High" : "Medium"}
                      </span>
                    </td>
                    <td className="weight-cell">
                      {(q.qualityScore * 0.8 + 0.2).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD 3: LEARNING SUBMISSIONS REVIEW */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              Learning Submissions Review ({submissions.length})
            </h3>
          </div>
          <div className="admin-table-scroll">
            {filteredSubmissions.length === 0 ? (
              <p style={{ color: "var(--text-subtle)", padding: "1.5rem", fontSize: "0.85rem" }}>
                Queue is clear. No pending submissions.
              </p>
            ) : (
              <div className="submissions-cyber-list">
                {filteredSubmissions.map((s, idx) => (
                  <div key={s.id} className="submission-cyber-item">
                    <div className="sub-user-col">
                      <div className="sub-user-avatar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <div className="sub-user-text">
                        <span className="sub-entity-title">{s.entityName}</span>
                        <span className="sub-q-hint">{s.questionText}</span>
                      </div>
                    </div>

                    <div className="sub-queue-col">
                      <span className="queue-tag">{idx + 1} queue</span>
                    </div>

                    <div className="sub-actions-col">
                      {s.status === "pending" ? (
                        <>
                          <button
                            className="btn-approve-cyan"
                            onClick={() => handleApprove(s.id)}
                            title="Approve and retrain matrix"
                          >
                            Approve
                          </button>
                          <button
                            className="btn-reject-red"
                            onClick={() => handleReject(s.id)}
                            title="Reject submission"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className={`status-static-${s.status}`}>{s.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
