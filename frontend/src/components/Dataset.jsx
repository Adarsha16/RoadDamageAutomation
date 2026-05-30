import { useInView } from '../hooks/useInView';

export default function Dataset() {
  const [ref, inView] = useInView();

  return (
    <section
      id="dataset"
      ref={ref}
      className={`py-24 lg:py-32 border-t border-border/50 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="site-container">
        <p className="text-sm font-medium text-accent uppercase tracking-widest mb-6">
          Dataset
        </p>
        <h2 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight mb-12">
          Trained on a six-country benchmark.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 lg:gap-16">
          {/* Description */}
          <div className="md:col-span-3">
            <div className="border border-border rounded-xl p-8">
              <h3 className="font-heading text-xl font-semibold mb-5">
                RDD2022
              </h3>
              <div className="space-y-4 text-base text-text-secondary leading-relaxed mb-8">
                <p>
                  The Road Damage Dataset 2022 was released as part of the
                  Crowdsensing-based Road Damage Detection Challenge (CRDDC&rsquo;22).
                  It contains 47,420 road images collected across six countries —
                  Japan, India, Czech Republic, Norway, the United States, and China
                  — with over 55,000 bounding-box annotations covering four damage
                  categories.
                </p>
                <p>
                  We use the official train/test split and augment the training
                  partition with Albumentations (mosaic tiling, HSV jitter, horizontal
                  flip, and simulated weather) to improve generalisation across
                  varying road surfaces, lighting conditions, and camera angles.
                </p>
              </div>
              <div className="flex flex-wrap gap-8 text-base border-t border-border pt-6">
                <div>
                  <span className="font-heading font-semibold">47,420</span>{' '}
                  <span className="text-text-muted">images</span>
                </div>
                <div>
                  <span className="font-heading font-semibold">55K+</span>{' '}
                  <span className="text-text-muted">annotations</span>
                </div>
                <div>
                  <span className="font-heading font-semibold">6</span>{' '}
                  <span className="text-text-muted">countries</span>
                </div>
              </div>
            </div>
          </div>

          {/* Damage classes */}
          <div className="md:col-span-2">
            <h3 className="font-heading text-sm font-medium text-text-muted uppercase tracking-widest mb-5">
              Damage Classes
            </h3>
            <div className="space-y-4">
              {[
                { code: 'D00', name: 'Longitudinal Crack', weight: '0.5', color: '#3498db', desc: 'Cracks running along the road direction.' },
                { code: 'D10', name: 'Transverse Crack', weight: '0.3', color: '#2dd4bf', desc: 'Cracks perpendicular to travel direction.' },
                { code: 'D20', name: 'Alligator Crack', weight: '0.8', color: '#e67e22', desc: 'Interconnected crack patterns resembling scales.' },
                { code: 'D40', name: 'Pothole', weight: '1.0', color: '#e74c3c', desc: 'Bowl-shaped depressions in the road surface.' },
              ].map((cls) => (
                <div key={cls.code} className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cls.color }} />
                    <span className="font-heading font-semibold text-sm">{cls.code}</span>
                    <span className="text-text-secondary text-sm">{cls.name}</span>
                    <span className="ml-auto text-xs font-mono text-text-muted">w={cls.weight}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed pl-5">{cls.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
