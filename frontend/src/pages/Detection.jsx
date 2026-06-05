import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';

const CLASS_INFO = [
  { key: 'Longitudinal Crack', label: 'Longitudinal', color: '#3498db' },
  { key: 'Transverse Crack',   label: 'Transverse',   color: '#2dd4bf' },
  { key: 'Alligator Crack',    label: 'Alligator',    color: '#e67e22' },
  { key: 'Pothole',            label: 'Pothole',      color: '#e74c3c' },
];

export default function Detection() {
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
      const res = await fetch('/api/detect', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <header className="border-b border-border bg-base/80 backdrop-blur-md sticky top-0 z-40">
        <div className="site-container h-14 flex items-center justify-between">
          <Link to="/" className="font-heading font-semibold text-sm tracking-tight">SHP</Link>
          <div className="flex items-center gap-5">
            <Link to="/severity" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Severity
            </Link>
            <Link to="/repair-plan" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Repair Plan
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
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">Detect</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
            Road Damage Detection
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
            Upload a road image to identify surface defects. The model classifies
            each detection into one of four damage categories and returns
            bounding boxes with confidence scores.
          </p>
        </div>

        <ImageUpload onFileSelected={handleUpload} disabled={loading} />

        {loading && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Analysing image…</span>
          </div>
        )}

        {error && (
          <div className="mt-6 border border-red-500/30 bg-red-500/5 rounded-lg px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-10 space-y-8 animate-in fade-in">
            {/* Class counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CLASS_INFO.map((cls) => {
                const count = result.class_counts?.[cls.key] || 0;
                return (
                  <div
                    key={cls.key}
                    className="border rounded-lg py-4 px-4 text-center transition-colors"
                    style={{
                      borderColor: count > 0 ? `${cls.color}30` : undefined,
                      background: count > 0 ? `${cls.color}08` : undefined,
                    }}
                  >
                    <div
                      className="font-heading text-2xl font-bold tabular-nums"
                      style={{ color: count > 0 ? cls.color : 'var(--color-text-muted)' }}
                    >
                      {count}
                    </div>
                    <div className="text-xs text-text-muted mt-1">{cls.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Annotated image */}
            {result.image && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-surface">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                    Annotated Output
                  </span>
                  <span className="text-xs text-text-muted font-mono">
                    {result.image_width}×{result.image_height} · {result.total_detections} defect{result.total_detections !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="p-3 sm:p-4 flex justify-center bg-surface-2">
                  <img
                    src={`data:image/jpeg;base64,${result.image}`}
                    alt="Detection result with annotated bounding boxes"
                    className="max-w-full max-h-[520px] rounded object-contain"
                  />
                </div>
              </div>
            )}

            {/* Detections table */}
            {result.detections?.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-border bg-surface">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                    Detections
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-muted uppercase tracking-wider border-b border-border bg-surface/60">
                        <th className="px-5 py-3 w-12">#</th>
                        <th className="px-5 py-3">Class</th>
                        <th className="px-5 py-3 text-right">Confidence</th>
                        <th className="px-5 py-3 text-right hidden sm:table-cell">Area (px²)</th>
                        <th className="px-5 py-3 text-right">Frame %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.detections.map((d, i) => (
                        <tr key={i} className="border-b border-border/40 hover:bg-surface/40 transition-colors">
                          <td className="px-5 py-3 font-mono text-text-muted text-xs">{i + 1}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLASS_INFO.find(c => c.key === d.class_name)?.color || '#888' }} />
                              {d.class_name}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono">{(d.confidence * 100).toFixed(1)}%</td>
                          <td className="px-5 py-3 text-right font-mono hidden sm:table-cell">{Math.round(d.bbox_area).toLocaleString()}</td>
                          <td className="px-5 py-3 text-right font-mono">{(d.relative_area * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No detections message */}
            {result.total_detections === 0 && (
              <div className="border border-teal/20 bg-teal/5 rounded-lg px-6 py-5 text-center">
                <p className="text-sm text-teal font-medium mb-1">No defects detected</p>
                <p className="text-xs text-text-muted">
                  This road surface appears to be in good condition. Try uploading an image with visible damage.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
