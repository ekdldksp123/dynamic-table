import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FC } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IReportConfig } from '@/types';
import { getAllReports } from '@/libs/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/export/')({
  loader: async () => await getAllReports(),
  component: () => <Reports route={Route} />,
});

interface ReportsProps {
  route: typeof Route;
}

const Reports: FC<ReportsProps> = ({ route }) => {
  const navigate = useNavigate();
  const reports: IReportConfig[] = route.useLoaderData();

  return (
    <div>
      <div className='flex w-[100%] px-5 py-3 justify-between items-center'>
        <h1>Export report to Excel</h1>
        <Button>export</Button>
      </div>
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Report ID</TableHead>
            <TableHead className='w-[65%]'>Report Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Writer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell className='font-medium'>{report.id}</TableCell>
              <TableCell className='cursor-pointer' onClick={() => navigate({ to: `/reports/${report.id}` })}>
                {report.name}
              </TableCell>
              <TableCell>{report.created_at ?? Date.now()}</TableCell>
              <TableCell>{report.writer ?? 'Admin'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
