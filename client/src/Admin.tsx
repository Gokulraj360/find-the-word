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

  const [activeTab, setActiveTab] = useState<"submissions" | "entities" | "questions">("submissions");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [entities, setEntities] = useState<EntityItem[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

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
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/entities", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEntities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/questions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      setSearchQuery("");
      setCurrentPage(1);
      if (activeTab === "submissions") fetchSubmissions();
      else if (activeTab === "entities") fetchEntities();
      else if (activeTab === "questions") fetchQuestions();
    }
  }, [token, activeTab]);

  const handleApprove = async (id: number) => {
    try {
      setStatusMsg("Approving and reloading matrix...");
      const res = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg(data.message);
      fetchSubmissions();
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
      setStatusMsg("Reloading cache...");
      const res = await fetch("/api/admin/reload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStatusMsg(`Matrix reloaded: ${data.entitiesCount} entities, ${data.questionsCount} questions.`);
    } catch (err: any) {
      alert("Reload error: " + err.message);
    }
  };

  if (!token) {
    return (
      <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
        <h2 style={{ marginBottom: "1.5rem" }}>Admin Login</h2>
        {loginError && <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>{loginError}</p>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Log In
            </button>
            <button type="button" className="btn" onClick={onBack}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Filter lists based on search
  const filteredSubmissions = submissions.filter(
    (s) =>
      s.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.questionText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEntities = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination helper
  const paginate = (items: any[]) => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return items.slice(startIndex, startIndex + PAGE_SIZE);
  };

  const totalPages = (count: number) => Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="card" style={{ maxWidth: "100%", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2>Cognitor Moderation & Admin</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn" onClick={handleReloadCache} title="Reload in-memory Float32Array matrix">
            🔄 Reload Cache
          </button>
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
          <button className="btn btn-primary" onClick={onBack}>
            Back to Game
          </button>
        </div>
      </div>

      {statusMsg && (
        <p style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent)", padding: "0.5rem 1rem", borderRadius: 4, marginBottom: "1rem" }}>
          {statusMsg}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn ${activeTab === "submissions" ? "btn-primary" : ""}`}
            onClick={() => setActiveTab("submissions")}
          >
            Submissions Queue ({submissions.length})
          </button>
          <button
            className={`btn ${activeTab === "entities" ? "btn-primary" : ""}`}
            onClick={() => setActiveTab("entities")}
          >
            Entities ({entities.length})
          </button>
          <button
            className={`btn ${activeTab === "questions" ? "btn-primary" : ""}`}
            onClick={() => setActiveTab("questions")}
          >
            Questions ({questions.length})
          </button>
        </div>

        <input
          type="text"
          className="form-input"
          style={{ width: 220, padding: "0.45rem 0.75rem", fontSize: "0.85rem" }}
          placeholder="Filter items..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {loading && <p style={{ color: "var(--text-muted)" }}>Loading data...</p>}

      {activeTab === "submissions" && (
        <div className="table-wrapper">
          {filteredSubmissions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>No submissions found.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Entity</th>
                    <th>Distinguishing Question</th>
                    <th>Answer</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filteredSubmissions).map((s: Submission) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>
                        <span className="badge" style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent)" }}>
                          {s.category === "object" ? "💡 Object" : "👤 Character"}
                        </span>
                      </td>
                      <td><strong>{s.entityName}</strong></td>
                      <td>{s.questionText}</td>
                      <td>{s.answer >= 0.75 ? "Yes" : s.answer <= 0.25 ? "No" : "Unknown"}</td>
                      <td>
                        <span className={`badge badge-${s.status}`}>{s.status}</span>
                      </td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>
                        {s.status === "pending" && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-success" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }} onClick={() => handleApprove(s.id)}>
                              Approve
                            </button>
                            <button className="btn btn-danger" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }} onClick={() => handleReject(s.id)}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages(filteredSubmissions.length) > 1 && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                  <button className="btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ padding: "0.25rem 0.6rem" }}>
                    Prev
                  </button>
                  <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Page {currentPage} of {totalPages(filteredSubmissions.length)}
                  </span>
                  <button className="btn" disabled={currentPage >= totalPages(filteredSubmissions.length)} onClick={() => setCurrentPage((p) => p + 1)} style={{ padding: "0.25rem 0.6rem" }}>
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "entities" && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Name</th>
                <th>Description</th>
                <th>Popularity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginate(filteredEntities).map((e: EntityItem) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>
                    <span className="badge" style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent)" }}>
                      {e.category === "object" ? "💡 Object" : "👤 Character"}
                    </span>
                  </td>
                  <td><strong>{e.name}</strong></td>
                  <td>{e.description || "—"}</td>
                  <td>{Math.round(e.popularity)}</td>
                  <td>
                    <span className={`badge badge-${e.status === "active" ? "approved" : "pending"}`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages(filteredEntities.length) > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ padding: "0.25rem 0.6rem" }}>
                Prev
              </button>
              <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Page {currentPage} of {totalPages(filteredEntities.length)}
              </span>
              <button className="btn" disabled={currentPage >= totalPages(filteredEntities.length)} onClick={() => setCurrentPage((p) => p + 1)} style={{ padding: "0.25rem 0.6rem" }}>
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "questions" && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Domain</th>
                <th>Question</th>
                <th>Quality Score</th>
                <th>Times Asked</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {paginate(filteredQuestions).map((q: QuestionItem) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td>
                    <span className="badge" style={{ background: "rgba(59,130,246,0.15)", color: "var(--accent)" }}>
                      {q.category === "object" ? "💡 Object" : q.category === "common" ? "🌐 Common" : "👤 Character"}
                    </span>
                  </td>
                  <td>{q.text}</td>
                  <td>{q.qualityScore.toFixed(2)}</td>
                  <td>{q.timesAsked}</td>
                  <td>{q.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages(filteredQuestions.length) > 1 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
              <button className="btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} style={{ padding: "0.25rem 0.6rem" }}>
                Prev
              </button>
              <span style={{ alignSelf: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Page {currentPage} of {totalPages(filteredQuestions.length)}
              </span>
              <button className="btn" disabled={currentPage >= totalPages(filteredQuestions.length)} onClick={() => setCurrentPage((p) => p + 1)} style={{ padding: "0.25rem 0.6rem" }}>
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
