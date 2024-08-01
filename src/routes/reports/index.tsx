import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { FC } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IReport } from '@/types';

export const Route = createFileRoute('/reports/')({
  loader: async () => {
    const res = await fetch(`http://localhost:3000/reports`);
    const json = await res.json();

    return json as unknown as IReport[];
  },
  component: () => <Reports route={Route} />,
});

interface ReportsProps {
  route: typeof Route;
}

const Reports: FC<ReportsProps> = ({ route }) => {
  const navigate = useNavigate();

  const reports: IReport[] = route.useLoaderData();

  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Report ID</TableHead>
          <TableHead className='w-[65%]'>Report Name</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Writer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow
            key={report.id}
            className='cursor-pointer'
            onClick={() => navigate({ to: `/reports/${report.id}` })}
          >
            <TableCell className='font-medium'>{report.id}</TableCell>
            <TableCell>{report.name}</TableCell>
            <TableCell>{report.created_at ?? Date.now()}</TableCell>
            <TableCell>{report.writer ?? 'Admin'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
