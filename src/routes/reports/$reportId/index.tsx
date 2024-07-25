import { Report } from '@/components/pages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reports/$reportId/')({
  loader: async ({ params }) => {
    const reportId = Number(params.reportId);
    const res = await fetch(`http://localhost:3000/reports?id=${reportId}`);
    const reportConfig = await res.json();
    //TODO 이렇게 픽스해서 가져올건지?
    reportConfig[0].itemsDisplayInfo = {
      code: false,
      name: false,
      base: false,
      value: true,
      isCustom: false,
    };
    return reportConfig[0];
  },
  component: () => <Report route={Route} />,
});

export interface ReportProps {
  route: typeof Route;
}
