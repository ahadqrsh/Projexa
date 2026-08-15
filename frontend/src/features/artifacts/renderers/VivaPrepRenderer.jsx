import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { titleCase } from '@/utils/format';

const difficultyVariant = { easy: 'success', medium: 'warning', hard: 'danger' };

const QuestionRow = ({ q }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-subtle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
      >
        <span className="text-sm text-content-primary">{q.question}</span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge variant={difficultyVariant[q.difficulty]}>{q.difficulty}</Badge>
          <ChevronDown className={cn('h-4 w-4 text-content-muted transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open && (
        <p className="border-t border-subtle p-3 text-sm leading-relaxed text-content-secondary">
          {q.modelAnswer}
        </p>
      )}
    </div>
  );
};

const VivaPrepRenderer = ({ content }) => (
  <div className="space-y-5">
    {content.categories?.map((cat) => (
      <Card key={cat.category}>
        <CardHeader>
          <CardTitle>{titleCase(cat.category)}</CardTitle>
          <Badge>{cat.questions?.length ?? 0} questions</Badge>
        </CardHeader>
        <CardBody className="space-y-2">
          {cat.questions?.map((q, i) => (
            <QuestionRow key={i} q={q} />
          ))}
        </CardBody>
      </Card>
    ))}
  </div>
);

export default VivaPrepRenderer;
