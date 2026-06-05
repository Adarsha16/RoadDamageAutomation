import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';

const GRADE_STYLES = {
  Good:     { bg: 'rgba(46,204,191,0.08)',  border: 'rgba(46,204,191,0.25)',  text: '#2dd4bf' },
  Fair:     { bg: 'rgba(241,196,15,0.08)',   border: 'rgba(241,196,15,0.25)',  text: '#f1c40f' },
  Poor:     { bg: 'rgba(230,126,34,0.08)',   border: 'rgba(230,126,34,0.25)',  text: '#e67e22' },
  Critical: { bg: 'rgba(231,76,60,0.08)',    border: 'rgba(231,76,60,0.25)',   text: '#e74c3c' },
};

const DAMAGE_COLORS = {
  'Longitudinal Crack': '#3498db',
  'Transverse Crack':   '#2dd4bf',
  'Alligator Crack':    '#e67e22',
  'Pothole':            '#e74c3c',
};

const ACTION_ICONS = {
  'Patch & Fill':    '🔧',
  'Crack Sealing':   '🔒',
  'Surface Overlay':  '🛤️',
  'General Patch':   '🔨',
};

export default function RepairPlan() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);

  const handleUpload = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedStep(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/repair-plan', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const plan = result?.repair_plan;
  const gs = result ? GRADE_STYLES[result.grade] || GRADE_STYLES.Good : null;

  // Cost breakdown by damage type
  const costByType = {};
  if (plan?.steps) {
    for (const s of plan.steps) {
      costByType[s.damage_type] = (costByType[s.damage_type] || 0) + s.cost;
    }
  }
  const maxCost = Math.max(...Object.values(costByType), 0.01);

  return (
    <div className="min-h-screen bg-base text-text-primary">
      <header className="border-b border-border bg-base/80 backdrop-blur-md sticky top-0 z-40">
        <div className="site-container h-14 flex items-center justify-between">
          <Link to="/" className="font-heading font-semibold text-sm tracking-tight">SHP</Link>
          <div className="flex items-center gap-5">
            <Link to="/detect" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Detection
            </Link>
            <Link to="/severity" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Severity
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
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">Analysis</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-3">
            Repair Plan Generator
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xl">
            Upload a road image to generate an optimal repair plan. The system evaluates the
            damages and determines the most cost-effective repair sequence.
          </p>
        </div>

        <ImageUpload onFileSelected={handleUpload} disabled={loading} />

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Generating repair plan…</span>
          </div>
        )}

        {error && (
          <div className="mt-6 border border-red-500/30 bg-red-500/5 rounded-lg px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && plan && (
          <div className="mt-10 space-y-8">

            {/* ── Summary dashboard ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Defects Found', value: result.total_detections, color: gs?.text, sub: result.grade },
                { label: 'Repair Steps', value: plan.segments_count, color: '#3498db', sub: 'optimised' },
                { label: 'Total Cost', value: plan.total_cost.toFixed(1), color: '#e67e22', sub: 'units' },
                { label: 'Est. Hours', value: plan.total_hours.toFixed(1), color: '#2dd4bf', sub: 'work hours' },
                { label: 'A* Nodes', value: plan.nodes_expanded, color: '#a78bfa', sub: `${plan.search_time_ms} ms` },
              ].map((card) => (
                <div
                  key={card.label}
                  className="border border-border rounded-lg py-4 px-4 text-center bg-surface/50"
                >
                  <div className="font-heading text-2xl font-bold tabular-nums" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="text-xs text-text-muted mt-1">{card.label}</div>
                  <div className="text-[10px] text-text-muted mt-0.5 font-mono">{card.sub}</div>
                </div>
              ))}
            </div>

            {/* ── Two-column: Annotated image + Cost breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {result.image && (
                <div className="lg:col-span-2 border border-border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b border-border bg-surface flex items-center justify-between">
                    <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                      Detected Damages
                    </span>
                    <span className="text-xs text-text-muted font-mono">
                      {result.image_width}×{result.image_height}
                    </span>
                  </div>
                  <div className="p-3 sm:p-4 flex justify-center bg-surface-2">
                    <img
                      src={`data:image/jpeg;base64,${result.image}`}
                      alt="Detection result with annotated bounding boxes"
                      className="max-w-full max-h-[420px] rounded object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Cost breakdown by type */}
              {Object.keys(costByType).length > 0 && (
                <div className="border border-border rounded-lg p-6 bg-surface">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                    Cost by Damage Type
                  </span>
                  <div className="mt-5 space-y-4">
                    {Object.entries(costByType)
                      .sort(([, a], [, b]) => b - a)
                      .map(([dtype, cost]) => (
                        <div key={dtype}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ background: DAMAGE_COLORS[dtype] || '#888' }} />
                              {dtype}
                            </span>
                            <span className="font-mono text-text-muted text-xs">{cost.toFixed(2)}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(cost / maxCost) * 100}%`, background: DAMAGE_COLORS[dtype] || '#888' }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* SI badge */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Severity Index</span>
                      <span className="font-mono text-sm font-semibold" style={{ color: gs?.text }}>
                        {result.severity_index.toFixed(5)}
                      </span>
                    </div>
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mt-2"
                      style={{ background: gs?.bg, border: `1px solid ${gs?.border}`, color: gs?.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: gs?.text }} />
                      {result.grade}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Repair Timeline ── */}
            {plan.steps.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-surface flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-text-muted uppercase tracking-widest">
                      Optimal Repair Sequence
                    </span>
                    <span className="text-[10px] text-text-muted ml-3 font-mono">
                      A* search · {plan.nodes_expanded} nodes · {plan.search_time_ms} ms
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>
                    Click steps to expand
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border-light" />

                    <div className="space-y-1">
                      {plan.steps.map((step, idx) => {
                        const isExpanded = expandedStep === idx;
                        const dmgColor = DAMAGE_COLORS[step.damage_type] || '#888';
                        const icon = ACTION_ICONS[step.action] || '🔧';
                        const costPct = plan.total_cost > 0 ? (step.cumulative_cost / plan.total_cost) * 100 : 0;

                        return (
                          <div
                            key={idx}
                            className={`relative pl-12 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isExpanded ? 'bg-surface-2 border border-border' : 'hover:bg-surface/60'
                            }`}
                            onClick={() => setExpandedStep(isExpanded ? null : idx)}
                          >
                            {/* Timeline node */}
                            <div
                              className="absolute left-2.5 top-4 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10"
                              style={{
                                borderColor: dmgColor,
                                background: `${dmgColor}15`,
                                color: dmgColor,
                              }}
                            >
                              {step.rank}
                            </div>

                            {/* Step summary row */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-lg leading-none">{icon}</span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-text-primary">{step.action}</span>
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                                      style={{ background: `${dmgColor}15`, color: dmgColor, border: `1px solid ${dmgColor}30` }}
                                    >
                                      <span className="w-1 h-1 rounded-full" style={{ background: dmgColor }} />
                                      {step.damage_type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-text-muted mt-0.5 truncate">{step.description}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-mono text-sm font-semibold" style={{ color: dmgColor }}>
                                  {step.cost.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-text-muted">{step.estimated_hours}h</div>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <span className="text-text-muted block mb-0.5">Severity</span>
                                  <span className="font-mono font-semibold">{(step.severity * 100).toFixed(1)}%</span>
                                </div>
                                <div>
                                  <span className="text-text-muted block mb-0.5">Confidence</span>
                                  <span className="font-mono font-semibold">{(step.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div>
                                  <span className="text-text-muted block mb-0.5">Area (frame %)</span>
                                  <span className="font-mono font-semibold">{(step.relative_area * 100).toFixed(3)}%</span>
                                </div>
                                <div>
                                  <span className="text-text-muted block mb-0.5">Priority</span>
                                  <span className="font-mono font-semibold">{step.priority_score.toFixed(3)}</span>
                                </div>

                                {/* Cumulative cost bar */}
                                <div className="col-span-full mt-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-text-muted">Cumulative cost</span>
                                    <span className="font-mono font-semibold">{step.cumulative_cost.toFixed(2)} / {plan.total_cost.toFixed(2)}</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${costPct}%`, background: `linear-gradient(90deg, #2dd4bf, ${dmgColor})` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── No detections ── */}
            {result.total_detections === 0 && (
              <div className="border border-teal/20 bg-teal/5 rounded-lg px-6 py-5 text-center">
                <p className="text-sm text-teal font-medium mb-1">No defects detected — no repairs needed</p>
                <p className="text-xs text-text-muted">
                  This road surface appears undamaged. Try an image with visible cracks or potholes.
                </p>
              </div>
            )}


          </div>
        )}
      </div>
    </div>
  );
}
