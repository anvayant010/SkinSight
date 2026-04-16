import { useCallback, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const ZONE_LABELS = {
  forehead: "Forehead",
  left_cheek: "Left Cheek",
  right_cheek: "Right Cheek",
  nose: "Nose",
  chin_jawline: "Chin / Jawline",
};

const SEVERITY_CONFIG = {
  Clear: { color: "#10b981", bg: "rgba(16,185,129,0.15)", label: "Clear" },
  Mild: { color: "#f59e0b", bg: "rgba(245,158,11,0.15)", label: "Mild" },
  Moderate: {
    color: "#f97316",
    bg: "rgba(249,115,22,0.15)",
    label: "Moderate",
  },
  Severe: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", label: "Severe" },
};

function getSeverityConfig(severity) {
  if (!severity) return SEVERITY_CONFIG.Clear;
  const key = Object.keys(SEVERITY_CONFIG).find(
    (k) => k.toLowerCase() === severity.toLowerCase(),
  );
  return SEVERITY_CONFIG[key] || SEVERITY_CONFIG.Mild;
}

/* ── Spinner ── */
function Spinner() {
  return (
    <span className="spinner" aria-label="Loading">
      <span className="spinner-ring" />
    </span>
  );
}

/* ── Upload Icon ── */
function UploadIcon() {
  return (
    <svg
      className="upload-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
      />
    </svg>
  );
}

/* ── Circular Progress ── */
function CircularProgress({ percent, color = "#6366f1" }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg className="circ-progress" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} className="circ-track" />
      <circle
        cx="60"
        cy="60"
        r={r}
        className="circ-fill"
        style={{
          stroke: color,
          strokeDasharray: circ,
          strokeDashoffset: offset,
        }}
      />
      <text x="60" y="64" textAnchor="middle" className="circ-label">
        {percent.toFixed(1)}%
      </text>
    </svg>
  );
}

/* ── Zone Bar ── */
function ZoneBar({ label, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="zone-row">
      <span className="zone-name">{label}</span>
      <div className="zone-track">
        <div className="zone-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="zone-count">{count}</span>
    </div>
  );
}

/* ── Drop Zone ── */
function DropZone({ file, previewUrl, onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped && dropped.type.startsWith("image/")) onFile(dropped);
    },
    [onFile],
  );

  return (
    <div
      className={`drop-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      aria-label="Upload image"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {previewUrl ? (
        <div className="drop-preview">
          <img src={previewUrl} alt="Preview" className="preview-img" />
          <div className="drop-overlay">
            <UploadIcon />
            <span>Click or drag to replace</span>
          </div>
        </div>
      ) : (
        <div className="drop-placeholder">
          <UploadIcon />
          <p className="drop-title">
            Drop your selfie here or{" "}
            <span className="drop-link">click to browse</span>
          </p>
          <p className="drop-hint">PNG, JPG, WEBP — up to 20 MB</p>
        </div>
      )}
    </div>
  );
}

/* ── Mini Drop Zone (for comparison) ── */
function MiniDrop({ label, file, previewUrl, onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={`mini-drop ${dragging ? "drag-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith("image/")) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {previewUrl ? (
        <img src={previewUrl} alt={label} className="mini-preview" />
      ) : (
        <div className="mini-placeholder">
          <UploadIcon />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

/* ── Stats Card ── */
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ── Timeline ── */
function Timeline() {
  const steps = [
    { label: "Now", desc: "Baseline recorded" },
    { label: "4–6 wks", desc: "Early improvement" },
    { label: "3 months", desc: "Significant change" },
  ];
  return (
    <div className="timeline">
      {steps.map((s, i) => (
        <div key={i} className="timeline-step">
          <div className={`timeline-dot ${i === 0 ? "active" : ""}`} />
          {i < steps.length - 1 && <div className="timeline-line" />}
          <div className="timeline-info">
            <span className="timeline-time">{s.label}</span>
            <span className="timeline-desc">{s.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main App
═══════════════════════════════════════════════════ */
export default function App() {
  /* ── Analyze state ── */
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  /* ── Compare state ── */
  const [baselineFile, setBaselineFile] = useState(null);
  const [followupFile, setFollowupFile] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState("");
  const [trackOpen, setTrackOpen] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  const baselineUrl = useMemo(
    () => (baselineFile ? URL.createObjectURL(baselineFile) : null),
    [baselineFile],
  );
  const followupUrl = useMemo(
    () => (followupFile ? URL.createObjectURL(followupFile) : null),
    [followupFile],
  );

  /* ── Analyze ── */
  const onAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please upload a selfie first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setShowResults(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setTimeout(() => setShowResults(true), 50);
    } catch (err) {
      setError(err.message || "Unexpected error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Compare ── */
  const onCompare = async () => {
    if (!baselineFile || !followupFile) {
      setCompareError("Upload both scans first.");
      return;
    }
    setComparing(true);
    setCompareError("");
    setCompareResult(null);
    try {
      const fd = new FormData();
      fd.append("baseline", baselineFile);
      fd.append("followup", followupFile);
      const res = await fetch(`${API_BASE}/track`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const p = await res.json().catch(() => ({}));
        throw new Error(p.detail || `Server error ${res.status}`);
      }
      setCompareResult(await res.json());
    } catch (err) {
      setCompareError(err.message || "Comparison failed.");
    } finally {
      setComparing(false);
    }
  };

  /* ── Derived ── */
  const sevConfig = result ? getSeverityConfig(result.acne_severity) : null;
  const zoneCounts = result?.zone_counts ?? {};
  const maxZone = Math.max(0, ...Object.values(zoneCounts));
  const hyper = result?.hyperpigmentation ?? {};
  const hyperPct = parseFloat(hyper.coverage_percent ?? 0);

  return (
    <div className="page">
      {/* ── Background orbs ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="container">
        {/* ══ HERO ══ */}
        <header className="hero">
          <div className="hero-badge">
            <span className="badge-dot" />
            AI-Powered Analysis
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">SkinSight</span>
            <span className="hero-title-white"> AI</span>
          </h1>
          <p className="hero-sub">
            Dermatological-grade skin analysis in seconds
          </p>
          <div className="hero-features">
            {[
              "Acne Detection",
              "Zone Mapping",
              "Hyperpigmentation",
              "Progress Tracking",
            ].map((f) => (
              <span key={f} className="feature-pill">
                {f}
              </span>
            ))}
          </div>
        </header>

        {/* ══ UPLOAD ══ */}
        <section className="card upload-card">
          <div className="card-header">
            <h2 className="card-title">Upload Your Photo</h2>
            <p className="card-sub">
              Use a well-lit, front-facing selfie for best results
            </p>
          </div>
          <form onSubmit={onAnalyze}>
            <DropZone file={file} previewUrl={previewUrl} onFile={setFile} />
            {error && (
              <div className="alert alert-error" role="alert">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="alert-icon"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}
            <button
              type="submit"
              className="btn-primary btn-large"
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <Spinner /> Analyzing…
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="btn-icon"
                  >
                    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                    <path
                      fillRule="evenodd"
                      d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Analyze Skin
                </>
              )}
            </button>
          </form>
        </section>

        {/* ══ RESULTS ══ */}
        {result && (
          <div
            className={`results-wrapper ${showResults ? "results-visible" : ""}`}
          >
            {/* ── Severity Banner ── */}
            <div
              className="severity-banner"
              style={{
                "--sev-color": sevConfig.color,
                "--sev-bg": sevConfig.bg,
              }}
            >
              <div className="sev-left">
                <span
                  className="sev-badge"
                  style={{
                    color: sevConfig.color,
                    background: sevConfig.bg,
                    borderColor: sevConfig.color,
                  }}
                >
                  <span
                    className="sev-dot"
                    style={{ background: sevConfig.color }}
                  />
                  {sevConfig.label}
                </span>
                <div>
                  <p className="sev-title">Analysis Complete</p>
                  <p className="sev-sub">
                    Acne score: <strong>{result.acne_score ?? "—"}</strong>
                  </p>
                </div>
              </div>
              <div
                className="sev-score-ring"
                style={{
                  background: `conic-gradient(${sevConfig.color} ${((result.acne_score ?? 0) / 10) * 360}deg, #1e1e2e 0deg)`,
                }}
              >
                <span>{result.acne_score ?? 0}</span>
              </div>
            </div>

            {/* ── Side-by-side images ── */}
            <div className="images-row">
              <div className="image-panel">
                <div className="image-label">
                  <span className="label-dot original" />
                  Original Photo
                </div>
                <div className="image-frame">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Original" />
                  ) : (
                    <div className="img-placeholder">No image</div>
                  )}
                </div>
              </div>
              <div className="image-panel">
                <div className="image-label">
                  <span className="label-dot annotated" />
                  AI Annotated
                </div>
                <div className="image-frame annotated-frame">
                  {result.annotated_image_base64 ? (
                    <img
                      src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                      alt="Annotated"
                    />
                  ) : (
                    <div className="img-placeholder">Processing…</div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Stats Cards ── */}
            <div className="stats-row">
              <StatCard
                icon="🧬"
                label="Acne Severity"
                value={result.acne_severity ?? "—"}
                accent={sevConfig.color}
              />
              <StatCard
                icon="🔬"
                label="Lesion Count"
                value={result.lesions?.length ?? 0}
                sub="detected lesions"
                accent="#6366f1"
              />
              <StatCard
                icon="🎨"
                label="Hyperpigmentation"
                value={`${hyperPct.toFixed(1)}%`}
                sub={hyper.severity ?? ""}
                accent="#8b5cf6"
              />
              <StatCard
                icon="🗺️"
                label="Most Affected Zone"
                value={
                  Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]
                    ? ZONE_LABELS[
                        Object.entries(zoneCounts).sort(
                          (a, b) => b[1] - a[1],
                        )[0][0]
                      ] ||
                      Object.entries(zoneCounts).sort(
                        (a, b) => b[1] - a[1],
                      )[0][0]
                    : "—"
                }
                accent="#f59e0b"
              />
            </div>

            {/* ── Zone Breakdown + Hyperpigmentation ── */}
            <div className="detail-row">
              {/* Zone bars */}
              <div className="card detail-card">
                <h3 className="detail-title">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="detail-icon"
                  >
                    <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM9.5 6A1.5 1.5 0 0 0 8 7.5v9a1.5 1.5 0 0 0 3 0v-9A1.5 1.5 0 0 0 9.5 6ZM3.5 10A1.5 1.5 0 0 0 2 11.5v5a1.5 1.5 0 0 0 3 0v-5A1.5 1.5 0 0 0 3.5 10Z" />
                  </svg>
                  Zone Breakdown
                </h3>
                <div className="zones">
                  {Object.entries(ZONE_LABELS).map(([key, label]) => (
                    <ZoneBar
                      key={key}
                      label={label}
                      count={zoneCounts[key] ?? 0}
                      max={maxZone}
                    />
                  ))}
                </div>
              </div>

              {/* Hyperpigmentation */}
              <div className="card detail-card hyper-card">
                <h3 className="detail-title">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="detail-icon"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Hyperpigmentation
                </h3>
                <div className="hyper-body">
                  <CircularProgress
                    percent={hyperPct}
                    color={
                      hyperPct > 20
                        ? "#ef4444"
                        : hyperPct > 10
                          ? "#f59e0b"
                          : "#10b981"
                    }
                  />
                  <div className="hyper-info">
                    <div className="hyper-stat">
                      <span className="hyper-stat-label">Coverage</span>
                      <span className="hyper-stat-val">
                        {hyperPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="hyper-stat">
                      <span className="hyper-stat-label">Severity</span>
                      <span className="hyper-stat-val">
                        {hyper.severity ?? "—"}
                      </span>
                    </div>
                    <div className="hyper-gauge-row">
                      {["Low", "Moderate", "High"].map((l, i) => (
                        <div
                          key={l}
                          className={`hyper-gauge-seg ${i === 0 ? "seg-green" : i === 1 ? "seg-amber" : "seg-red"}`}
                        >
                          <span>{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Summary ── */}
            {result.summary && (
              <div className="card summary-card">
                <h3 className="detail-title">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="detail-icon"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  AI Summary
                </h3>
                <blockquote className="summary-quote">
                  <span className="quote-mark">"</span>
                  {result.summary}
                  <span className="quote-mark">"</span>
                </blockquote>
                <div className="disclaimer">
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="disclaimer-icon"
                  >
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 11a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm.75-3.75a.75.75 0 0 1-1.5 0V5.75a.75.75 0 0 1 1.5 0v2.5Z" />
                  </svg>
                  This analysis is for informational purposes only and does not
                  constitute medical advice. Consult a dermatologist for
                  clinical diagnosis.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROGRESS TRACKING ══ */}
        <section className="card track-card">
          <button
            className="track-toggle"
            onClick={() => setTrackOpen((o) => !o)}
            aria-expanded={trackOpen}
          >
            <div className="track-toggle-left">
              <div className="track-icon-wrap">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="track-title">Progress Tracking</h2>
                <p className="track-sub">
                  Compare baseline vs. follow-up scans
                </p>
              </div>
            </div>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`chevron ${trackOpen ? "chevron-up" : ""}`}
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {trackOpen && (
            <div className="track-body">
              <div className="track-uploads">
                <div className="track-upload-slot">
                  <p className="slot-label">
                    <span className="slot-num">01</span>
                    Baseline Scan
                  </p>
                  <MiniDrop
                    label="Upload Baseline"
                    file={baselineFile}
                    previewUrl={baselineUrl}
                    onFile={setBaselineFile}
                  />
                </div>
                <div className="track-arrow">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="track-upload-slot">
                  <p className="slot-label">
                    <span className="slot-num">02</span>
                    Follow-up Scan
                  </p>
                  <MiniDrop
                    label="Upload Follow-up"
                    file={followupFile}
                    previewUrl={followupUrl}
                    onFile={setFollowupFile}
                  />
                </div>
              </div>

              {compareError && (
                <div className="alert alert-error">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="alert-icon"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {compareError}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={onCompare}
                disabled={comparing || !baselineFile || !followupFile}
              >
                {comparing ? (
                  <>
                    <Spinner />
                    Comparing…
                  </>
                ) : (
                  "Compare Progress"
                )}
              </button>

              {compareResult && (
                <div className="compare-results">
                  <div className="compare-metrics">
                    <div className="compare-metric">
                      <span className="cm-label">Similarity</span>
                      <span className="cm-value accent-purple">
                        {typeof compareResult.similarity === "number"
                          ? `${(compareResult.similarity * 100).toFixed(1)}%`
                          : (compareResult.similarity ?? "—")}
                      </span>
                    </div>
                    <div className="compare-metric">
                      <span className="cm-label">Lesion Change</span>
                      <span
                        className={`cm-value ${(compareResult.improvement_percent ?? 0) >= 0 ? "accent-green" : "accent-red"}`}
                      >
                        {typeof compareResult.improvement_percent === "number"
                          ? `${compareResult.improvement_percent > 0 ? "+" : ""}${compareResult.improvement_percent.toFixed(1)}%`
                          : (compareResult.improvement_percent ?? "—")}
                      </span>
                    </div>
                    {compareResult.summary && (
                      <div className="compare-summary">
                        {compareResult.summary}
                      </div>
                    )}
                  </div>
                  <Timeline />
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="footer">
          <p>
            SkinSight AI &mdash; Hackathon Build &mdash; Not for clinical use
          </p>
        </footer>
      </div>
    </div>
  );
}
