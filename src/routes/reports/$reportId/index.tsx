import { Report } from '@/components/pages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reports/$reportId/')({
  loader: async ({ params }) => {
    const reportId = Number(params.reportId);
    const res = await fetch(`http://localhost:3000/reports?id=${reportId}`);
    const reportConfig = await res.json();
    return reportConfig[0];
  },
  component: () => <Report route={Route} />,
});

export interface ReportProps {
  route: typeof Route;
}
