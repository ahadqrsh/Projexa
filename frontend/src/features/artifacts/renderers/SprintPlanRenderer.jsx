import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const SprintPlanRenderer = ({ content }) => (
  <div className="space-y-5">
    <p className="text-sm text-content-secondary">
      {content.sprints?.length ?? 0} sprints · {content.sprintLengthWeeks} week{content.sprintLengthWeeks === 1 ? '' : 's'} each
    </p>
    {content.sprints?.map((sprint) => (
      <Card key={sprint.sprintNumber}>
        <CardHeader>
          <div>
            <CardTitle>Sprint {sprint.sprintNumber}</CardTitle>
            <p className="mt-1 text-sm text-content-secondary">{sprint.goal}</p>
          </div>
          <Badge>
            {sprint.backlog?.reduce((sum, b) => sum + (b.storyPoints ?? 0), 0)} pts
          </Badge>
        </CardHeader>
        <CardBody className="space-y-2">
          {sprint.backlog?.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-subtle p-2.5 text-sm">
              <div>
                <p className="text-content-primary">{item.title}</p>
                <p className="text-xs text-content-muted">{item.relatedFeature}</p>
              </div>
              <Badge variant="primary">{item.storyPoints} pts</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    ))}
  </div>
);

export default SprintPlanRenderer;
