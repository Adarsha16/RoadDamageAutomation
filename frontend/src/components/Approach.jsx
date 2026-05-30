import { useInView } from '../hooks/useInView';

const cards = [
  {
    title: 'Dataset Preparation & Audit',
    body: 'We audited the full RDD2022 corpus — 47,420 images across six countries — validating train/validation splits, verifying bounding-box integrity, and profiling class distributions. The audit flagged a heavy imbalance toward longitudinal cracks, which informed our augmentation strategy.',
    detail: 'An Albumentations pipeline was built to address the imbalance: mosaic tiling, HSV jitter, horizontal flips, and simulated weather (rain, fog) were applied to the training partition. Augmented samples were visually inspected to confirm bounding-box consistency after transforms.',
    status: 'Completed',
  },
  {
    title: 'Baseline Model Training',
    body: 'A YOLOv8n model was trained for 30 epochs on the augmented dataset. Training loss curves converged smoothly, and a baseline mAP@50 was established for each of the four damage classes. The best checkpoint was exported for inference.',
    detail: 'The trained weights (best.pt) now power both the detection and severity analysis pages of this application. Inference runs at approximately 150 ms per frame on CPU, with pre-processing and post-processing adding minimal overhead.',
    status: 'Completed',
  },
  {
    title: 'Severity Index Formulation',
    body: 'We designed a composite Severity Index (SI) that weights each detection by damage type, model confidence, and bounding-box area relative to the frame. Class weights reflect real-world repair urgency — potholes (1.0) outweigh transverse cracks (0.3).',
    detail: 'The formula was validated across 30 randomly sampled frames from the dataset. Results produced a clear distribution: 63% of frames graded "Good," while 17% reached "Critical." The worst frame (SI = 0.34) contained two large potholes covering a third of the visible surface.',
    status: 'Completed',
  },
  {
    title: 'Severity Map & Route Visualisation',
    body: 'A Folium-based heatmap was developed to plot severity scores along surveyed road segments. Colour-coded route polylines (green/orange/red) are generated using OSRM routing between GPS waypoints.',
    detail: 'The map currently displays six waypoints along the Suryabinayak–Dhulikhel corridor, each tagged with a severity score and category. The visualisation is embedded directly into the severity analysis page and will scale to additional routes as local survey data grows.',
    status: 'Completed',
  },
];

export default function Approach() {
  const [ref, inView] = useInView();

  return (
    <section
      id="approach"
      ref={ref}
      className={`py-24 lg:py-32 bg-surface border-t border-border/50 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="site-container">
        <p className="text-sm font-medium text-accent uppercase tracking-widest mb-6">
          Methodology
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight mb-4">
          What we built and how it works.
        </h2>
        <p className="text-base text-text-secondary leading-relaxed max-w-2xl mb-12">
          Each phase was validated before moving to the next. The detection model,
          severity formula, and mapping pipeline are now integrated into a single
          end-to-end workflow accessible through this application.
        </p>

        <div className="space-y-6">
          {cards.map((c, i) => (
            <div
              key={i}
              className="bg-surface-2 border border-border rounded-xl overflow-hidden p-8"
            >
              <div className="flex items-start gap-4 mb-6">
                <span className="shrink-0 w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-heading text-xl font-semibold">
                      {c.title}
                    </h3>
                    <span className="text-xs font-medium text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                      {c.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-base text-text-secondary leading-relaxed space-y-4 pl-14">
                <p>{c.body}</p>
                <p className="text-text-muted">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
