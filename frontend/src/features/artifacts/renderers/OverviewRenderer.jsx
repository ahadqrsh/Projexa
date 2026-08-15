import Badge from '@/components/ui/Badge';

const Section = ({ title, children }) => (
  <div>
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-muted">{title}</h3>
    {children}
  </div>
);

const OverviewRenderer = ({ content }) => (
  <div className="space-y-6">
    <Section title="Objective">
      <p className="text-sm leading-relaxed text-content-secondary">{content.objective}</p>
    </Section>
    <Section title="Real-world problem">
      <p className="text-sm leading-relaxed text-content-secondary">{content.realWorldProblem}</p>
    </Section>
    <Section title="Scope">
      <p className="text-sm leading-relaxed text-content-secondary">{content.scope}</p>
    </Section>
    <Section title="Expected outcome">
      <p className="text-sm leading-relaxed text-content-secondary">{content.expectedOutcome}</p>
    </Section>
    <Section title="Target users">
      <div className="flex flex-wrap gap-1.5">
        {content.targetUsers?.map((u) => (
          <Badge key={u} variant="primary">{u}</Badge>
        ))}
      </div>
    </Section>
    <Section title="Key benefits">
      <ul className="space-y-1.5">
        {content.keyBenefits?.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm text-content-secondary">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-400" />
            {b}
          </li>
        ))}
      </ul>
    </Section>
  </div>
);

export default OverviewRenderer;
