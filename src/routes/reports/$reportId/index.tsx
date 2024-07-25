import { Report } from '@/components/pages';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/reports/$reportId/')({
  loader: async ({ params }) => {
    const reportId = Number(params.reportId);
    const res = await fetch(`http://localhost:3000/reports?id=${reportId}`);
    const reportConfig = await res.json();

    const itemsKey = reportConfig[0].items.length ? Object.keys(reportConfig[0].items[0]) : [];
    //FIXME
    reportConfig[0].itemsDisplayInfo = itemsKey.reduce((acc, cur) => {
      let display = true;
      switch (cur) {
        case 'code':
        case 'name':
        case 'base':
        case 'isCustom':
          display = false;
          break;
        case 'value':
          display = true;
          break;
        default:
          display = true;
          break;
      }
      return { ...acc, [cur]: display };
    }, {});
    return reportConfig[0];
  },
  component: () => <Report route={Route} />,
});

export interface ReportProps {
  route: typeof Route;
}
