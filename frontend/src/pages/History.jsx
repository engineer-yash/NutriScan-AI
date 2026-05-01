import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHistory, deleteHistoryItem } from '../services/api.js';
import AllergenBadge from '../components/AllergenBadge.jsx';
import ExpiryAlert from '../components/ExpiryAlert.jsx';
import { History as HistoryIcon, ScanLine, ArrowRight, Trash2, X, Loader2 } from 'lucide-react';

function ScoreBadge({ score, category }) {
  const color = score >= 70 ? 'bg-leaf-600' : score >= 40 ? 'bg-sun-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className={`${color} text-white rounded-full w-10 h-10 grid place-items-center font-bold font-display text-lg`}>
        {score}
      </span>
      <span className="text-xs font-semibold text-neutral-600">{category}</span>
    </div>
  );
}

function ConfirmDialog({ open, busy, onCancel, onConfirm, productName }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      data-testid="delete-confirm-dialog"
      onClick={onCancel}
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
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-700"
            aria-label="Close"
            data-testid="delete-confirm-close"
          >
            <X size={18}/>
          </button>
        </div>
        <div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold text-ink-900">Delete this scan?</h3>
          <p className="text-neutral-600 text-sm mt-1">
            Are you sure you want to delete{productName ? <> <span className="font-semibold">{productName}</span></> : ' this scan'}?
            This cannot be undone.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-ghost justify-center"
            disabled={busy}
            data-testid="delete-confirm-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 disabled:opacity-60"
            data-testid="delete-confirm-confirm"
          >
            {busy ? <><Loader2 size={14} className="animate-spin"/> Deleting…</> : <><Trash2 size={14}/> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pending, setPending] = useState(null); // { id, productName }
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getHistory()
      .then(r => !cancelled && setRows(r || []))
      .catch(e => !cancelled && setError(e?.response?.data?.message || 'Failed to load history.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const askDelete = (e, row) => {
    // Prevent card navigation
    e.preventDefault();
    e.stopPropagation();
    setPending({ id: row.id, productName: row.productName });
  };

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteHistoryItem(pending.id);
      setRows(prev => prev.filter(r => r.id !== pending.id));
      setToast('Scan deleted.');
      setTimeout(() => setToast(null), 2500);
      setPending(null);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-up">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leaf-50 text-leaf-700 text-sm font-semibold">
            <HistoryIcon size={14}/> Scan history
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-3">Your past scans</h1>
          <p className="text-neutral-600 text-sm sm:text-base">Every food label you&apos;ve analyzed, newest first.</p>
        </div>
        <Link to="/analyze" className="btn-primary self-start sm:self-auto" data-testid="history-new-scan">
          <ScanLine size={16}/> New scan
        </Link>
      </header>

      {loading && <p className="text-neutral-500" data-testid="history-loading">Loading your scans…</p>}
      {error && <p className="text-red-600" data-testid="history-error">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="card p-8 sm:p-12 text-center" data-testid="history-empty">
          <p className="text-neutral-600 mb-4">You haven&apos;t scanned anything yet.</p>
          <Link to="/analyze" className="btn-primary">Analyze your first food label <ArrowRight size={16}/></Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5" data-testid="history-grid">
        {rows.map(row => (
          <div key={row.id} className="relative group" data-testid={`history-row-${row.id}`}>
            <Link
              to={`/result/${row.id}`}
              className="card p-4 space-y-3 hover:-translate-y-0.5 transition-transform block"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-50 border border-leaf-100">
                {row.imageUrl
                  ? <img src={row.imageUrl} alt={row.productName} className="w-full h-full object-cover"/>
                  : <div className="w-full h-full grid place-items-center text-neutral-400">No image</div>}
              </div>
              <div>
                <h3 className="font-semibold text-ink-900 line-clamp-1">{row.productName}</h3>
                <p className="text-xs text-neutral-500">{row.category}</p>
              </div>
              <div className="flex items-center justify-between">
                <ScoreBadge score={row.healthScore} category={row.healthCategory} />
                <span className="text-xs text-neutral-500">
                  {new Date(row.createdAt).toLocaleDateString()}
                </span>
              </div>
              {row.expiryDetected && (
                <ExpiryAlert
                  compact
                  detected={row.expiryDetected}
                  expiryDate={row.expiryDate}
                  daysRemaining={row.daysRemaining}
                />
              )}
              {row.allergens?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {row.allergens.slice(0, 3).map((a, i) => <AllergenBadge key={i} name={a}/>)}
                </div>
              )}
            </Link>

            {/* Delete button — absolute so it floats over the card */}
            <button
              type="button"
              onClick={(e) => askDelete(e, row)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur border border-red-100 text-red-600 grid place-items-center shadow opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label={`Delete scan ${row.productName}`}
              data-testid={`history-delete-${row.id}`}
            >
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!pending}
        busy={deleting}
        productName={pending?.productName}
        onCancel={() => !deleting && setPending(null)}
        onConfirm={confirmDelete}
      />

      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-ink-900 text-white text-sm rounded-full px-4 py-2 shadow-xl"
          data-testid="history-toast"
        >
          {toast}
        </div>
      )}
    </div>
  );
}