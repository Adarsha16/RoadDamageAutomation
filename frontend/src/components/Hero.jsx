import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32" id="hero">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative site-container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 lg:gap-16 items-end mb-20">
          <div className="md:col-span-3">
            <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-[4rem] leading-tight tracking-tight mb-6">
              Smart Highway Patrol
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
              Automated road defect detection powered by YOLO and deep learning,
              combined with A* heuristic search for intelligent repair planning —
              mapping Nepal&apos;s road infrastructure damage in real time.
            </p>
          </div>

          <div className="md:col-span-2 flex flex-wrap md:flex-col md:items-end gap-4">
            <Link
              to="/detect"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-accent text-white text-base font-medium hover:bg-accent-hover transition-colors"
            >
              Run Detection
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <Link
              to="/severity"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-base text-text-secondary hover:border-border-light hover:text-text-primary transition-colors"
            >
              Severity Analysis
            </Link>
            <Link
              to="/repair-plan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-accent/30 bg-accent/5 text-base text-accent hover:bg-accent/10 hover:border-accent/50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              AI Repair Plan
            </Link>
          </div>
        </div>

        {/* Pipeline */}
        <div className="border border-border rounded-xl bg-surface/60 p-8 sm:p-10">
          <p className="text-sm text-text-muted uppercase tracking-widest mb-8 font-medium">
            Project Pipeline
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-8 sm:gap-5">
            {[
              { step: 'Data Audit', desc: 'Dataset splits validated, class distribution analysed, augmentation pipeline built and tested.', done: true },
              { step: 'Model Training', desc: 'YOLOv8 baseline trained for 30 epochs. Loss curves and mAP@50 metrics extracted per class.', done: true },
              { step: 'Severity Index', desc: 'SI formula implemented with class-weighted scoring. Validated on 30 sample frames.', done: true },
              { step: 'Route Mapping', desc: 'Folium heatmap prototype with severity-graded road segments along local routes.', done: true },
              { step: 'AI Repair Plan', desc: 'A* search agent that bridges neural perception with symbolic planning for optimal repair sequencing.', done: true },
            ].map((s, i) => (
              <div key={i} className="flex sm:flex-col items-start sm:items-center gap-4 relative">
                {i < 4 && (
                  <div className="hidden sm:block absolute top-4 left-1/2 w-full h-px bg-border-light" style={{ transform: 'translateX(16px)' }} />
                )}
                <div className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm font-mono relative z-10 ${
                  s.done
                    ? 'border-teal/40 bg-teal/10 text-teal'
                    : 'border-border-light bg-surface-2 text-text-muted'
                }`}>
                  {s.done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <div className="sm:text-center">
                  <div className="font-heading font-semibold text-base text-text-primary mb-1.5">{s.step}</div>
                  <p className="text-sm text-text-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
