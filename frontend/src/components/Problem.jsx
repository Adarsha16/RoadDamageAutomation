import { useInView } from '../hooks/useInView';

export default function Problem() {
  const [ref, inView] = useInView();

  return (
    <section
      id="problem"
      ref={ref}
      className={`py-24 lg:py-32 border-t border-border/50 transition-all duration-700 ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="site-container">
        <p className="text-sm font-medium text-accent uppercase tracking-widest mb-6">
          Problem
        </p>

        <h2 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight mb-12">
          Nepal&apos;s roads are deteriorating faster than they can be inspected.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-16 items-start">
          <div className="md:col-span-3 space-y-6 text-base text-text-secondary leading-relaxed">
            <p>
              Nepal has over 28,000 kilometres of road network winding through
              some of the most rugged terrain on Earth. Every monsoon season,
              heavy rainfall triggers landslides, floods, and soil erosion that
              tear into asphalt and gravel surfaces — producing potholes,
              longitudinal cracks, transverse cracks, and alligator cracking at
              a pace that overwhelms existing maintenance capacity.
            </p>
            <p>
              Current inspection relies on engineers walking or driving each
              road segment and recording damage by hand. This process is slow
              (a team covers roughly 15–20 km per day), subjective (severity
              ratings vary between inspectors), and expensive. Remote districts
              in the mid-hills and Terai often go uninspected for years.
            </p>
            <p>
              The result is a reactive maintenance cycle: roads are repaired
              only after they become dangerous, and limited budgets are spread
              without data on where repairs are most urgent. SHP replaces this
              guesswork with automated, camera-based detection that can survey
              hundreds of kilometres in a single day.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { value: '28,000+', unit: 'km', label: 'Road network across 77 districts' },
                { value: '~60%', unit: '', label: 'Roads damaged post-monsoon' },
                { value: '15–20', unit: 'km/day', label: 'Manual inspection rate' },
                { value: '<5%', unit: '', label: 'Network inspected annually' },
              ].map((s, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-6">
                  <div className="font-heading text-2xl font-bold text-text-primary">
                    {s.value}
                    {s.unit && <span className="text-base font-medium text-text-muted ml-1.5">{s.unit}</span>}
                  </div>
                  <div className="text-sm text-text-muted mt-2.5 leading-relaxed">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
