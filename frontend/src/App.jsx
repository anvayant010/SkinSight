import { useState, useMemo } from "react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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

function getSeverityConfig(s) {
  const key = s && SEVERITY_CONFIG[s] ? s : "Clear";
  return SEVERITY_CONFIG[key];
}

function Spinner() {
  return (
    <svg className="spinner" viewBox="0 0 24 24" fill="none">
      <circle className="spinner-ring" cx="12" cy="12" r="10" strokeWidth="3" />
    </svg>
  );
}

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
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function CircularProgress({ percent, color }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg className="circ-progress" viewBox="0 0 88 88">
      <circle className="circ-track" cx="44" cy="44" r={r} />
      <circle
        className="circ-fill"
        cx="44"
        cy="44"
        r={r}
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
      <text
        className="circ-label"
        x="44"
        y="44"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {percent.toFixed(1)}%
      </text>
    </svg>
  );
}

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

function DropZone({ file, previewUrl, onFile }) {
  const [dragging, setDragging] = useState(false);
  const ref = { current: null };
  return (
    <div
      className={`drop-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer?.files?.[0];
        if (f && f.type.startsWith("image/")) onFile(f);
      }}
      onClick={() => ref.current?.click()}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file && previewUrl ? (
        <div className="drop-preview">
          <img src={previewUrl} alt="preview" className="preview-img" />
          <div className="drop-overlay">
            <UploadIcon />
            <span>Change photo</span>
          </div>
        </div>
      ) : (
        <div className="drop-placeholder">
          <UploadIcon />
          <p className="drop-title">
            Drag &amp; drop or <span className="drop-link">browse</span>
          </p>
          <p className="drop-hint">
            JPG, PNG, WebP &mdash; front-facing selfie
          </p>
        </div>
      )}
    </div>
  );
}

function MiniDrop({ label, file, previewUrl, onFile }) {
  const ref = { current: null };
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
        const f = e.dataTransfer?.files?.[0];
        if (f && f.type.startsWith("image/")) onFile(f);
      }}
      onClick={() => ref.current?.click()}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      {file && previewUrl ? (
        <div className="mini-preview">
          <img src={previewUrl} alt={label} />
          <span className="mini-change">Tap to change</span>
        </div>
      ) : (
        <div className="mini-placeholder">
          <UploadIcon />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ANALYZE TAB
══════════════════════════════════════════════ */
function AnalyzeTab() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

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

  const sevConfig = result ? getSeverityConfig(result.acne_severity) : null;
  const zoneCounts = result?.zone_counts ?? {};
  const maxZone = Math.max(0, ...Object.values(zoneCounts));
  const hyper = result?.hyperpigmentation ?? {};
  const hyperPct = parseFloat(hyper.coverage_percent ?? 0);
  // acne_score is [0..1]; display as percentage
  const acneScorePct = ((result?.acne_score ?? 0) * 100).toFixed(1);

  return (
    <div className="tab-content">
      {/* ── Upload + Annotated side-by-side ── */}
      <div className="analyze-top-row">
        <section className="card upload-card">
          <div className="card-header">
            <h2 className="card-title">Upload Your Photo</h2>
            <p className="card-sub">
              Well-lit, front-facing selfie for best results
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
                  <Spinner /> Analyzing&hellip;
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

        {result && (
          <div
            className={`card annotated-side-card ${showResults ? "results-visible" : ""}`}
          >
            <div className="card-header">
              <h2 className="card-title">AI Annotated</h2>
              <p className="card-sub">
                <span className="legend-dot legend-red" /> Lesions &nbsp;
                <span className="legend-dot legend-purple" /> Hyperpigmentation
                &nbsp;
                <span className="legend-dot legend-white" /> Face zone
              </p>
            </div>
            <div className="image-frame annotated-frame annotated-side-frame">
              {result.annotated_image_base64 ? (
                <img
                  src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
                  alt="Annotated"
                />
              ) : (
                <div className="img-placeholder">Processing&hellip;</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      {result && (
        <div
          className={`results-wrapper ${showResults ? "results-visible" : ""}`}
        >
          {/* Severity Banner */}
          <div
            className="severity-banner"
            style={{ "--sev-color": sevConfig.color, "--sev-bg": sevConfig.bg }}
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
                  Acne score: <strong>{acneScorePct}%</strong>
                </p>
              </div>
            </div>
            {/* ring uses acne_score * 360 — score is [0,1] */}
            <div
              className="sev-score-ring"
              style={{
                background: `conic-gradient(${sevConfig.color} ${(result.acne_score ?? 0) * 360}deg, #1e1e2e 0deg)`,
              }}
            >
              <span>{acneScorePct}%</span>
            </div>
          </div>

          {/* 4-col Stat Cards */}
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
              accent="#f59e0b"
              value={
                Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]
                  ? ZONE_LABELS[
                      Object.entries(zoneCounts).sort(
                        (a, b) => b[1] - a[1],
                      )[0][0]
                    ] ||
                    Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0][0]
                  : "—"
              }
            />
          </div>

          {/* Zone breakdown + Hyperpigmentation */}
          <div className="detail-row">
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

          {/* Summary */}
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
                constitute medical advice. Consult a dermatologist for clinical
                diagnosis.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   PROGRESS TRACKING TAB
══════════════════════════════════════════════ */
function TrackTab() {
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState("");

  const beforeUrl = useMemo(
    () => (beforeFile ? URL.createObjectURL(beforeFile) : null),
    [beforeFile],
  );
  const afterUrl = useMemo(
    () => (afterFile ? URL.createObjectURL(afterFile) : null),
    [afterFile],
  );

  const onCompare = async () => {
    if (!beforeFile || !afterFile) {
      setCompareError("Upload both scans first.");
      return;
    }
    setComparing(true);
    setCompareError("");
    setCompareResult(null);
    try {
      const fd = new FormData();
      fd.append("baseline", beforeFile); // BEFORE = acne skin
      fd.append("followup", afterFile); // AFTER  = clearer skin
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

  const improvement = compareResult?.improvement_percent ?? 0;
  const improved = improvement > 0;

  return (
    <div className="tab-content">
      <div className="card track-card-full">
        <div className="card-header">
          <h2 className="card-title">Progress Tracking</h2>
          <p className="card-sub">
            Upload a <strong>before</strong> photo (with acne) on the left and
            an <strong>after</strong> photo (clearer skin) on the right to
            measure your improvement
          </p>
        </div>

        {/* Before ──→ After upload row */}
        <div className="track-uploads">
          {/* BEFORE */}
          <div className="track-upload-slot">
            <p className="slot-label">
              <span className="slot-num before-num">BEFORE</span>
              Skin with Acne
            </p>
            <MiniDrop
              label="Upload Before Photo"
              file={beforeFile}
              previewUrl={beforeUrl}
              onFile={setBeforeFile}
            />
            {compareResult && (
              <div className="slot-count">
                <span className="slot-count-num bad">
                  {compareResult.baseline_lesions}
                </span>
                <span className="slot-count-label">lesions</span>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="track-arrow">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="track-arrow-label">Progress</span>
          </div>

          {/* AFTER */}
          <div className="track-upload-slot">
            <p className="slot-label">
              <span className="slot-num after-num">AFTER</span>
              Clearer Skin
            </p>
            <MiniDrop
              label="Upload After Photo"
              file={afterFile}
              previewUrl={afterUrl}
              onFile={setAfterFile}
            />
            {compareResult && (
              <div className="slot-count">
                <span className={`slot-count-num ${improved ? "good" : "bad"}`}>
                  {compareResult.followup_lesions}
                </span>
                <span className="slot-count-label">lesions</span>
              </div>
            )}
          </div>
        </div>

        {compareError && (
          <div className="alert alert-error">
            <svg viewBox="0 0 20 20" fill="currentColor" className="alert-icon">
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
          disabled={comparing || !beforeFile || !afterFile}
        >
          {comparing ? (
            <>
              <Spinner /> Comparing&hellip;
            </>
          ) : (
            "Compare Progress"
          )}
        </button>

        {compareResult && (
          <div className="compare-results">
            {/* 4-col metrics */}
            <div className="compare-metrics">
              <div className="compare-metric">
                <span className="cm-label">Before Lesions</span>
                <span className="cm-value accent-red">
                  {compareResult.baseline_lesions}
                </span>
              </div>
              <div className="compare-metric">
                <span className="cm-label">After Lesions</span>
                <span
                  className={`cm-value ${improved ? "accent-green" : "accent-red"}`}
                >
                  {compareResult.followup_lesions}
                </span>
              </div>
              <div className="compare-metric">
                <span className="cm-label">Improvement</span>
                <span
                  className={`cm-value ${improved ? "accent-green" : "accent-red"}`}
                >
                  {improvement > 0 ? "+" : ""}
                  {improvement.toFixed(1)}%
                </span>
              </div>
              <div className="compare-metric">
                <span className="cm-label">Image Similarity</span>
                <span className="cm-value accent-purple">
                  {(compareResult.similarity * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Trend bar */}
            <div className="trend-bar-wrap">
              <div className="trend-bar-track">
                <div
                  className={`trend-bar-fill ${improved ? "trend-good" : "trend-bad"}`}
                  style={{ width: `${Math.min(Math.abs(improvement), 100)}%` }}
                />
              </div>
              <span
                className={`trend-label ${improved ? "accent-green" : "accent-red"}`}
              >
                {improvement > 10
                  ? `${improvement.toFixed(1)}% improvement`
                  : improvement < -10
                    ? `${Math.abs(improvement).toFixed(1)}% worsening`
                    : "Stable — minimal change"}
              </span>
            </div>

            {compareResult.summary && (
              <div className="compare-summary">{compareResult.summary}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════ */
export default function App() {
  const [activeTab, setActiveTab] = useState("analyze");

  return (
    <div className="page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="container">
        {/* Hero */}
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

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "analyze" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("analyze")}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="tab-icon">
              <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path
                fillRule="evenodd"
                d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                clipRule="evenodd"
              />
            </svg>
            Skin Analysis
          </button>
          <button
            className={`tab-btn ${activeTab === "track" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("track")}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="tab-icon">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z"
                clipRule="evenodd"
              />
            </svg>
            Progress Tracking
          </button>
        </div>

        {/* Active tab */}
        {activeTab === "analyze" ? <AnalyzeTab /> : <TrackTab />}

        <footer className="footer">
          <p>
            SkinSight AI &mdash; Hackathon Build &mdash; Not for clinical use
          </p>
        </footer>
      </div>
    </div>
  );
}
