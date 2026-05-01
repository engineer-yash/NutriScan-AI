import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../services/api.js";
import HealthScoreRing from "../components/HealthScoreRing.jsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  LayoutDashboard,
  ScanLine,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

function Stat({ label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">
        {label}
      </div>
      <div className="font-display text-4xl font-extrabold text-ink-900 mt-1">
        {value}
      </div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  );
}

const PIE_COLORS = ["#1f9247", "#f5b301", "#d93025"];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDashboard()
      .then((r) => !cancelled && setData(r))
      .catch(
        (e) =>
          !cancelled &&
          setError(e?.response?.data?.message || "Failed to load dashboard."),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading)
    return (
      <p className="text-neutral-500" data-testid="dashboard-loading">
        Loading dashboard…
      </p>
    );
  if (error)
    return (
      <p className="text-red-600" data-testid="dashboard-error">
        {error}
      </p>
    );
  if (!data) return null;

  const pieData = [
    { name: "Healthy", value: data.healthyCount },
    { name: "Moderate", value: data.moderateCount },
    { name: "Unhealthy", value: data.unhealthyCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 text-sm font-semibold">
            <LayoutDashboard size={14}/> Your nutrition dashboard
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-3">How you&apos;re eating</h1>
          <p className="text-neutral-600 text-sm sm:text-base">Aggregated insights from every scan.</p>
        </div>
        <Link to="/analyze" className="btn-primary self-start sm:self-auto" data-testid="dashboard-new-scan">
          <ScanLine size={16}/> New scan
        </Link>
      </header>

      {data.totalScans === 0 ? (
        <div className="card p-12 text-center" data-testid="dashboard-empty">
          <p className="text-neutral-600 mb-4">
            No scans yet — start to unlock insights.
          </p>
          <Link to="/analyze" className="btn-primary">
            Scan your first food label <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <>
          {/* TOP STATS */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Stat label="Total scans" value={data.totalScans} />
            <Stat
              label="Avg health score"
              value={data.averageHealthScore}
              sub={`out of 100`}
            />
            <Stat label="Healthy choices" value={data.healthyCount} />
            <Stat label="Unhealthy flags" value={data.unhealthyCount} />
          </section>

          {/* MAIN GRID */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="card p-6 flex flex-col items-center justify-center">
              <HealthScoreRing
                score={Math.round(data.averageHealthScore)}
                label="Your Avg"
                size={180}
                stroke={14}
              />
            </div>

            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center gap-2 text-leaf-700 font-semibold mb-4">
                <TrendingUp size={16} /> Distribution
              </div>
              {pieData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-neutral-500">Not enough data yet.</p>
              )}
            </div>
          </section>

          {/* CATEGORIES + ALLERGENS */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Most-scanned categories</h3>
              {data.topCategories?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.topCategories}>
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1f9247" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-neutral-500">No categories yet.</p>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Top allergens detected</h3>
              {data.topAllergens?.length ? (
                <ul className="space-y-2" data-testid="dashboard-allergens">
                  {data.topAllergens.map((a, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between border-b border-leaf-100 py-2 last:border-0"
                    >
                      <span className="capitalize font-medium text-ink-900">
                        {a.allergen}
                      </span>
                      <span className="text-sm text-neutral-500">
                        {a.count} scans
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-500">
                  No allergens detected across your scans.
                </p>
              )}
            </div>
          </section>

          {/* RECENT */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
              <h3 className="font-semibold">Recent scans</h3>
              <Link
                to="/history"
                className="btn-ghost text-sm"
                data-testid="dashboard-view-all"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" data-testid="dashboard-recent">
              {data.recentScans.map((r) => (
                <Link
                  key={r.id}
                  to={`/result/${r.id}`}
                  className="card p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-xl bg-neutral-50 overflow-hidden border border-leaf-100 flex-shrink-0">
                    {r.imageUrl && (
                      <img
                        src={r.imageUrl}
                        alt={r.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold line-clamp-1">
                      {r.productName}
                    </p>
                    <p className="text-xs text-neutral-500">{r.category}</p>
                    <p className="text-xs text-leaf-700 font-semibold mt-0.5">
                      {r.healthCategory} · {r.healthScore}/100
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
