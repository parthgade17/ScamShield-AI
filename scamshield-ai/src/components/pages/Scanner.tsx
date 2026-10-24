
import { useState } from "react";

const API_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://127.0.0.1:5000";

interface Indicator {
  name: string;
  evidence?: string;
  points?: number;
  source?: string;
}

interface ScanResult {
  ai_status?: string;
  ai_model?: string;
  ai_score?: number;
  detection_method?: string;
  risk_score?: number;
  risk_level?: string;
  rule_based_score?: number;
  indicators?: Indicator[];
  recommendations?: string[];
  message?: string;
  scanned_text?: string;
  error?: string;
  [key: string]: unknown;
}

function getRiskColor(level?: string) {
  switch (level?.toLowerCase()) {
    case "critical":
      return "#dc2626";
    case "high":
      return "#ea580c";
    case "medium":
      return "#ca8a04";
    case "low":
      return "#16a34a";
    default:
      return "#64748b";
  }
}

function formatLabel(value?: string) {
  if (!value) return "Not reported";
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Scanner() {
  const [message, setMessage] = useState("");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleScan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message, SMS, email, or suspicious link to scan.");
      return;
    }

    setLoading(true);
    setError("");
    setScan(null);

    try {
      const response = await fetch(`${API_URL}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = (await response.json()) as ScanResult;

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `Scan failed (HTTP ${response.status}).`
        );
      }

      setScan(data);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Unknown error";

      setError(
        `Unable to scan the message. ${reason}. Check that the Flask backend is running at ${API_URL} and that CORS is configured correctly.`
      );
    } finally {
      setLoading(false);
    }
  }

  function clearScanner() {
    setMessage("");
    setScan(null);
    setError("");
  }

  const riskScore = Math.max(
    0,
    Math.min(100, Number(scan?.risk_score ?? scan?.ai_score ?? 0))
  );

  const riskColor = getRiskColor(scan?.risk_level);

  const aiIsAvailable =
    scan?.ai_status?.toLowerCase() === "available" ||
    scan?.ai_status?.toLowerCase() === "active";

  const indicators = Array.isArray(scan?.indicators) ? scan.indicators : [];
  const recommendations = Array.isArray(scan?.recommendations)
    ? scan.recommendations
    : [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-2xl">
              🛡️
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
                ScamShield AI
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Message Scanner
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Analyze suspicious SMS messages, emails, and text content for
            potential scams using your backend detection system.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Analyze a message</h2>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                Real-time scan
              </span>
            </div>

            <form onSubmit={handleScan}>
              <label
                htmlFor="scam-message"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Suspicious message or text
              </label>

              <textarea
                id="scam-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Paste a suspicious SMS, email, payment request, or message here..."
                rows={8}
                maxLength={20000}
                disabled={loading}
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Do not enter passwords, OTPs, or private account details.</span>
                <span>{message.length}/20000</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                      Analyzing...
                    </>
                  ) : (
                    <>🔍 Scan Message</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearScanner}
                  disabled={loading}
                  className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </form>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
              >
                <p className="font-semibold">Scan error</p>
                <p className="mt-1 break-words">{error}</p>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
            <h2 className="text-lg font-semibold">AI engine status</h2>
            <p className="mt-1 text-sm text-slate-400">
              Status reported by the latest scan response.
            </p>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`h-3 w-3 rounded-full ${
                    scan
                      ? aiIsAvailable
                        ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                        : "bg-amber-400"
                      : "bg-slate-600"
                  }`}
                />
                <div>
                  <p className="font-semibold">
                    {scan
                      ? aiIsAvailable
                        ? "Gemini AI active"
                        : `AI status: ${formatLabel(scan.ai_status)}`
                      : "Waiting for scan"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {scan
                      ? scan.ai_model || "Model not reported by backend"
                      : "Run a scan to check the reported status"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">Detection method</span>
                <span className="text-right text-sm font-medium">
                  {formatLabel(scan?.detection_method)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <span className="text-sm text-slate-400">AI score</span>
                <span className="text-sm font-semibold">
                  {typeof scan?.ai_score === "number"
                    ? `${scan.ai_score}/100`
                    : "Not reported"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pb-1">
                <span className="text-sm text-slate-400">Rule-based score</span>
                <span className="text-sm font-semibold">
                  {typeof scan?.rule_based_score === "number"
                    ? `${scan.rule_based_score}/100`
                    : "Not reported"}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-cyan-500/5 p-4">
              <p className="text-sm font-semibold text-cyan-300">
                Safety reminder
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Never share OTPs, UPI PINs, passwords, or banking credentials
                with anyone. Verify urgent requests through official channels.
              </p>
            </div>
          </aside>
        </section>

        {scan && (
          <section
            aria-live="polite"
            className="mt-6 space-y-5"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-sm text-slate-400">Scan result</p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {formatLabel(scan.risk_level || "Unknown risk")}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Risk classification returned by the backend.
                  </p>
                </div>

                <div
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: `${riskColor}80`,
                    backgroundColor: `${riskColor}15`,
                  }}
                >
                  <span
                    className="text-3xl font-bold"
                    style={{ color: riskColor }}
                  >
                    {riskScore}
                  </span>
                  <span className="text-xs text-slate-400">out of 100</span>
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${riskScore}%`,
                    backgroundColor: riskColor,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>Lower risk</span>
                <span>Higher risk</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">Risk level</p>
                  <p className="mt-1 font-semibold" style={{ color: riskColor }}>
                    {formatLabel(scan.risk_level)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">Indicators detected</p>
                  <p className="mt-1 text-xl font-bold">{indicators.length}</p>
                </div>
                <div className="rounded-xl bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">AI analysis</p>
                  <p className="mt-1 font-semibold">
                    {aiIsAvailable ? "Available" : formatLabel(scan.ai_status)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Detected indicators</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Signals returned by the detection system.
                </p>

                {indicators.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {indicators.map((indicator, index) => (
                      <li
                        key={`${indicator.name}-${index}`}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">
                            {indicator.name || "Unspecified indicator"}
                          </p>
                          {indicator.source && (
                            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                              {formatLabel(indicator.source)}
                            </span>
                          )}
                        </div>
                        {indicator.evidence && (
                          <p className="mt-2 break-words text-sm leading-6 text-slate-400">
                            {indicator.evidence}
                          </p>
                        )}
                        {typeof indicator.points === "number" && (
                          <p className="mt-2 text-xs text-slate-500">
                            Score contribution: {indicator.points}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-400">
                    No specific indicators were included in the response.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Recommended actions</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Suggested precautions based on this scan.
                </p>

                {recommendations.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {recommendations.map((recommendation, index) => (
                      <li
                        key={`${recommendation}-${index}`}
                        className="flex gap-3 rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-300"
                      >
                        <span className="mt-0.5 text-cyan-400">✓</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-400">
                    No recommendations were included in the response.
                  </p>
                )}

                <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-semibold text-amber-300">
                    Important
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Automated detection can make mistakes. Treat this score as
                    guidance and independently verify suspicious messages.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="mt-8 border-t border-slate-800 py-5 text-center text-xs text-slate-500">
          ScamShield AI · Detection results are advisory and are not a guarantee
          that a message is safe or fraudulent.
        </footer>
      </div>
    </main>
  );
}
