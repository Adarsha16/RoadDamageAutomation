import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

const RoadScene3D = lazy(() => import('./RoadScene3D'));

function SceneFallback() {
  return (
    <div className="w-full h-full min-h-[360px] lg:min-h-[480px] flex items-center justify-center bg-surface/40">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center mb-20">
          <div className="lg:col-span-5">
            <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-[3.5rem] leading-tight tracking-tight mb-6">
              Smart Highway Patrol
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl mb-8">
              Automated road defect detection powered by YOLO and deep learning —
              mapping Nepal&apos;s road infrastructure damage in real time.
            </p>

            <div className="flex flex-wrap gap-4">
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
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-border rounded-xl bg-surface/40 overflow-hidden h-[360px] lg:h-[480px] pointer-events-none">
              <Suspense fallback={<SceneFallback />}>
                <RoadScene3D />
              </Suspense>
            </div>
            <p className="text-xs text-text-muted text-center mt-3 uppercase tracking-widest">
              Live 3D road damage visualization
            </p>
          </div>
        </div>

        {/* Pipeline */}
        <div className="border border-border rounded-xl bg-surface/60 p-8 sm:p-10">
          <p className="text-sm text-text-muted uppercase tracking-widest mb-8 font-medium">
            Project Pipeline
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 sm:gap-6">
            {[
              { step: 'Data Audit', desc: 'Dataset splits validated, class distribution analysed, augmentation pipeline built and tested.', done: true },
              { step: 'Model Training', desc: 'YOLOv8 baseline trained for 30 epochs. Loss curves and mAP@50 metrics extracted per class.', done: true },
              { step: 'Severity Index', desc: 'SI formula implemented with class-weighted scoring. Validated on 30 sample frames.', done: true },
              { step: 'Route Mapping', desc: 'Folium heatmap prototype with severity-graded road segments along local routes.', done: true },
            ].map((s, i) => (
              <div key={i} className="flex sm:flex-col items-start sm:items-center gap-4 relative">
                {i < 3 && (
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
