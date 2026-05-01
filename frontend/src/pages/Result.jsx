import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getHistoryDetail, deleteHistoryItem } from '../services/api.js';
import HealthScoreRing from '../components/HealthScoreRing.jsx';
import AllergenBadge, { WarningBadge } from '../components/AllergenBadge.jsx';
import ExpiryAlert from '../components/ExpiryAlert.jsx';
import { ChevronLeft, ShieldAlert, Leaf, RotateCcw, FileText, ScanLine, Trash2, Loader2, X } from 'lucide-react';

function RiskPill({ level }) {
  const map = {
    Low:    'bg-leaf-50 text-leaf-800 border-leaf-200',
    Medium: 'bg-amber-50 text-amber-800 border-amber-200',
    High:   'bg-red-50 text-red-700 border-red-200'
  };
  return (
    <span className={`pill border ${map[level] || map.Low}`} data-testid={`risk-${(level||'low').toLowerCase()}`}>
      <ShieldAlert size={12}/> Risk: {level || 'Low'}
    </span>
  );
}

export default function Result() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lastScan') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (id && (!data || String(data?.id) !== String(id))) {
      setLoading(true);
      getHistoryDetail(id)
        .then(r => !cancelled && setData(r))
        .catch(e => !cancelled && setError(e?.response?.data?.message || 'Failed to load scan.'))
        .finally(() => !cancelled && setLoading(false));
    }
    return () => { cancelled = true; };
  }, [id]);  // eslint-disable-line react-hooks/exhaustive-deps

  const onConfirmDelete = async () => {
    if (!data?.id) return;
    setDeleting(true);
    try {
      await deleteHistoryItem(data.id);
      sessionStorage.removeItem('lastScan');
      navigate('/history');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete scan.');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <p className="text-neutral-500" data-testid="result-loading">Loading scan…</p>;
  if (error)   return <p className="text-red-600" data-testid="result-error">{error}</p>;
  if (!data)   return (
    <div className="card p-8 sm:p-10 text-center" data-testid="result-empty">
      <p className="text-neutral-600 mb-4">No scan selected.</p>
      <Link to="/analyze" className="btn-primary"><ScanLine size={16}/> Analyze a food label</Link>
    </div>
  );

  const a = data.analysis || {};
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/history" className="btn-ghost text-sm" data-testid="result-back">
          <ChevronLeft size={14}/> Back to history
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            data-testid="result-delete-btn"
          >
            <Trash2 size={14}/> Delete
          </button>
          <Link to="/analyze" className="btn-primary text-sm" data-testid="result-new-scan">
            <ScanLine size={14}/> New scan
          </Link>
        </div>
      </div>

      {/* Expiry banner at the top for visibility */}
      {a.expiryDetected && (
        <ExpiryAlert
          detected={a.expiryDetected}
          expiryDate={a.expiryDate}
          daysRemaining={a.daysRemaining}
        />
      )}

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left: image + OCR */}
        <div className="lg:col-span-2 card p-4 sm:p-5 space-y-4 animate-fade-up" data-testid="result-image-card">
          <div className="rounded-2xl overflow-hidden border border-leaf-100 bg-neutral-50 aspect-square">
            {data.imageUrl
              ? <img src={data.imageUrl} alt={a.productName} className="w-full h-full object-contain" data-testid="result-image"/>
              : <div className="w-full h-full grid place-items-center text-neutral-400">No image</div>}
          </div>
          <div>
            <h3 className="font-display text-xl sm:text-2xl font-bold" data-testid="result-product-name">{a.productName || 'Unknown product'}</h3>
            <p className="text-sm text-neutral-500">{a.category}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RiskPill level={a.riskLevel} />
            <span className="pill bg-leaf-50 text-leaf-800 border border-leaf-200"><Leaf size={12}/> {a.healthCategory || 'Moderate'}</span>
            {a.expiryDetected && (
              <ExpiryAlert
                compact
                detected={a.expiryDetected}
                expiryDate={a.expiryDate}
                daysRemaining={a.daysRemaining}
              />
            )}
          </div>
        </div>

        {/* Right: AI breakdown */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-5">
          <div className="card p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 animate-fade-up">
            <HealthScoreRing score={a.healthScore || 0} />
            <div className="space-y-2 flex-1">
              <h4 className="font-semibold uppercase tracking-wider text-xs text-neutral-500">AI Summary</h4>
              <p className="text-ink-900 leading-relaxed text-sm sm:text-base" data-testid="result-summary">{a.summary || '—'}</p>
            </div>
          </div>

          <div className="card p-4 sm:p-6 space-y-4 animate-fade-up">
            <div className="flex items-center gap-2 text-red-700 font-semibold">
              <ShieldAlert size={16}/> Flagged ingredients
            </div>
            {a.flaggedIngredients?.length
              ? <div className="flex flex-wrap gap-2" data-testid="result-flagged">
                  {a.flaggedIngredients.map((f, i) => (
                    <span key={i} className="pill bg-red-50 text-red-700 border border-red-200">{f}</span>
                  ))}
                </div>
              : <p className="text-sm text-neutral-500">No risky ingredients flagged.</p>}
            {a.riskExplanation && (
              <p className="text-sm text-neutral-700 bg-neutral-50 rounded-2xl p-4 border border-neutral-100" data-testid="result-risk-explanation">
                {a.riskExplanation}
              </p>
            )}
          </div>

          <div className="card p-4 sm:p-6 space-y-4 animate-fade-up">
            <div className="flex items-center gap-2 text-amber-700 font-semibold">⚠ Allergens &amp; warnings</div>
            <div className="flex flex-wrap gap-2" data-testid="result-allergens">
              {(a.allergens || []).map((al, i) => <AllergenBadge key={i} name={al} />)}
              {!a.allergens?.length && <span className="text-sm text-neutral-500">No allergens detected.</span>}
            </div>
            <div className="flex flex-wrap gap-2" data-testid="result-warnings">
              {(a.warnings || []).map((w, i) => <WarningBadge key={i} text={w}/>)}
            </div>
          </div>

          <div className="card p-4 sm:p-6 space-y-3 animate-fade-up">
            <div className="flex items-center gap-2 text-leaf-700 font-semibold">
              <RotateCcw size={16}/> Healthier alternatives
            </div>
            {a.alternatives?.length
              ? <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2" data-testid="result-alternatives">
                  {a.alternatives.map((alt, i) => (
                    <li key={i} className="rounded-2xl border border-leaf-100 bg-leaf-50/50 px-4 py-3 text-sm text-leaf-900">
                      ✓ {alt}
                    </li>
                  ))}
                </ul>
              : <p className="text-sm text-neutral-500">No alternatives suggested.</p>}
          </div>

          {data.extractedText && (
            <details className="card p-4 sm:p-6 animate-fade-up" data-testid="result-ocr">
              <summary className="flex items-center gap-2 cursor-pointer font-semibold text-ink-900">
                <FileText size={16}/> Raw OCR text
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs text-neutral-600 bg-neutral-50 rounded-2xl p-4 border border-neutral-100 overflow-x-auto">
                {data.extractedText}
              </pre>
            </details>
          )}
        </div>
      </section>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setConfirmOpen(false)}
          data-testid="result-delete-dialog"
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-leaf-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 grid place-items-center">
                <Trash2 size={20}/>
              </div>
              <button
                type="button"
                onClick={() => !deleting && setConfirmOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
                aria-label="Close"
              >
                <X size={18}/>
              </button>
            </div>
            <div>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold text-ink-900">Delete this scan?</h3>
              <p className="text-neutral-600 text-sm mt-1">
                Are you sure you want to delete <span className="font-semibold">{a.productName || 'this scan'}</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn-ghost justify-center"
                disabled={deleting}
                data-testid="result-delete-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 disabled:opacity-60"
                data-testid="result-delete-confirm"
              >
                {deleting ? <><Loader2 size={14} className="animate-spin"/> Deleting…</> : <><Trash2 size={14}/> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}