import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';

const GRADE_STYLES = {
  Good:     { bg: 'rgba(46,204,191,0.08)',  border: 'rgba(46,204,191,0.25)',  text: '#2dd4bf' },
  Fair:     { bg: 'rgba(241,196,15,0.08)',   border: 'rgba(241,196,15,0.25)',  text: '#f1c40f' },
  Poor:     { bg: 'rgba(230,126,34,0.08)',   border: 'rgba(230,126,34,0.25)',  text: '#e67e22' },
  Critical: { bg: 'rgba(231,76,60,0.08)',    border: 'rgba(231,76,60,0.25)',   text: '#e74c3c' },
};

const CLASS_COLORS = {
  'Longitudinal Crack': '#3498db',
  'Transverse Crack': '#2dd4bf',
  'Alligator Crack': '#e67e22',
  'Pothole': '#e74c3c',
};

const TIERS = [
  { tier: 'Good',     range: 'SI < 0.005',  color: '#2dd4bf', desc: 'Minimal or no visible damage.' },
  { tier: 'Fair',     range: '0.005 – 0.02', color: '#f1c40f', desc: 'Minor cracks, low urgency.' },
  { tier: 'Poor',     range: '0.02 – 0.05',  color: '#e67e22', desc: 'Noticeable damage, needs maintenance.' },
  { tier: 'Critical', range: 'SI ≥ 0.05',    color: '#e74c3c', desc: 'Severe damage, immediate action.' },
];

export default function SeverityDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/severity', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const gs = result ? GRADE_STYLES[result.grade] || GRADE_STYLES.Good : null;

  // Per-class contribution aggregation
  const classContribs = {};
  if (result?.detections) {
    for (const d of result.detections) {
      classContribs[d.class_name] = (classContribs[d.class_name] || 0) + d.contribution;
    }
  }
  const maxContrib = Math.max(...Object.values(classContribs), 0.0001);

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <header className="border-b border-border bg-base/80 backdrop-blur-md sticky top-0 z-40">
        <div className="site-container h-14 flex items-center justify-between">
          <Link to="/" className="font-heading font-semibold text-sm tracking-tight">SHP</Link>
          <div className="flex items-center gap-5">
            <Link to="/detect" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Detection
            </Link>
            <Link to="/" className="text-sm text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="site-container py-12">
        {/* Page header */}
        <div className="mb-10">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">Analyse</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
            Severity Analysis
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
            Upload a road image to compute the Severity Index. The SI weights
            each defect by damage type, model confidence, and physical footprint
            to produce a single condition score.
          </p>
        </div>

        <ImageUpload onFileSelected={handleUpload} disabled={loading} />

        {loading && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Computing severity…</span>
          </div>
        )}

        {error && (
          <div className="mt-6 border border-red-500/30 bg-red-500/5 rounded-lg px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-8">
            {/* SI + Annotated image */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* SI Card */}
              <div
                className="rounded-lg p-6 flex flex-col items-center justify-center text-center"
                style={{ background: gs?.bg, border: `1px solid ${gs?.border}` }}
              >
                <p className="text-xs text-text-muted uppercase tracking-widest mb-4">Severity Index</p>
                <div className="font-heading text-5xl font-bold tabular-nums mb-1" style={{ color: gs?.text }}>
                  {result.severity_index.toFixed(4)}
                </div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mt-3"
                  style={{ background: gs?.bg, border: `1px solid ${gs?.border}`, color: gs?.text }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: gs?.text }} />
                  {result.grade}
                </div>
                <p className="text-xs text-text-muted mt-5">
                  {result.total_detections} defect{result.total_detections !== 1 ? 's' : ''} · {result.image_width}×{result.image_height}
                </p>
                <div className="mt-5 pt-4 border-t w-full" style={{ borderColor: gs?.border }}>
                  <p className="text-[11px] text-text-muted font-mono">
                    SI = Σ(W<sub>i</sub> × Conf<sub>i</sub> × A<sub>rel,i</sub>)
                  </p>
                </div>
              </div>

              {/* Annotated image */}
              {result.image && (
                <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border bg-surface">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                      Annotated Output
                    </span>
                  </div>
                  <div className="p-3 sm:p-4 flex justify-center bg-surface-2">
                    <img
                      src={`data:image/jpeg;base64,${result.image}`}
                      alt="Severity analysis result"
                      className="max-w-full max-h-[420px] rounded object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Per-class contribution bars */}
            {Object.keys(classContribs).length > 0 && (
              <div className="border border-border rounded-lg p-6 bg-surface">
                <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                  Contribution by Type
                </span>
                <div className="mt-5 space-y-4">
                  {Object.entries(classContribs)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cls, contrib]) => (
                      <div key={cls}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: CLASS_COLORS[cls] || '#888' }} />
                            {cls}
                          </span>
                          <span className="font-mono text-text-muted text-xs">{contrib.toFixed(5)}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${(contrib / maxContrib) * 100}%`, background: CLASS_COLORS[cls] || '#888' }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Detection breakdown */}
            {result.detections?.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-surface">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                    Per-Detection Breakdown
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border bg-surface/60">
                        <th className="px-5 py-3 w-10">#</th>
                        <th className="px-5 py-3">Class</th>
                        <th className="px-5 py-3 text-right">Weight</th>
                        <th className="px-5 py-3 text-right">Conf.</th>
                        <th className="px-5 py-3 text-right hidden sm:table-cell">Rel. Area</th>
                        <th className="px-5 py-3 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.detections.map((d, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-surface/40 transition-colors">
                          <td className="px-5 py-3 font-mono text-text-muted text-xs">{i + 1}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLASS_COLORS[d.class_name] || '#888' }} />
                              {d.class_name}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono">{d.weight}</td>
                          <td className="px-5 py-3 text-right font-mono">{(d.confidence * 100).toFixed(1)}%</td>
                          <td className="px-5 py-3 text-right font-mono hidden sm:table-cell">{(d.relative_area * 100).toFixed(3)}%</td>
                          <td className="px-5 py-3 text-right font-mono font-semibold" style={{ color: gs?.text }}>
                            {d.contribution.toFixed(5)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-surface/60 font-semibold">
                        <td colSpan={5} className="px-5 py-3 text-right text-xs text-text-muted uppercase tracking-wider">Total SI</td>
                        <td className="px-5 py-3 text-right font-mono" style={{ color: gs?.text }}>
                          {result.severity_index.toFixed(5)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No detections */}
            {result.total_detections === 0 && (
              <div className="border border-teal/20 bg-teal/5 rounded-lg px-6 py-5 text-center">
                <p className="text-sm text-teal font-medium mb-1">No defects detected — Grade: Good</p>
                <p className="text-xs text-text-muted">
                  This road surface appears undamaged. Try an image with visible cracks or potholes.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reference section */}
        <div className="mt-20 space-y-10">
          {/* Grading scale */}
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-5">Grading Scale</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {TIERS.map((t) => (
                <div key={t.tier} className="border border-border rounded-lg p-4 bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                    <span className="font-heading text-sm font-semibold">{t.tier}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mb-2">{t.desc}</p>
                  <span className="text-[11px] font-mono text-text-muted">{t.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Folium Map */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="p-5 border-b border-border bg-surface">
              <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                Route Severity Map
              </span>
            </div>
            <div className="h-72 sm:h-[28rem]">
              <iframe
                src="/severity_map.html"
                title="Severity heatmap along surveyed route"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
