import { Report } from '@/components/pages';
import { getReportById } from '@/libs/api';
import { GroupStateProvider } from '@/shared/groupState.provider';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reports/$reportId/')({
  loader: async ({ params }) => await getReportById(params.reportId),
  component: () => (
    <GroupStateProvider>
      <Report route={Route} />
    </GroupStateProvider>
  ),
});

export interface ReportProps {
  route: typeof Route;
}
