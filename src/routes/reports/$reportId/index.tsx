import { Report } from '@/components/pages';
import { getReportById } from '@/libs/api';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reports/$reportId/')({
  loader: async ({ params }) => await getReportById(params.reportId),
  component: () => <Report route={Route} />,
});

export interface ReportProps {
  route: typeof Route;
}
