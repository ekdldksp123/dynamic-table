import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { FC } from 'react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

export const Route = createFileRoute('/reports/')({
  component: () => <Reports />
})

const reports = [
  {
    reportId: 'AHH001',
    reportName: 'dynamic report 1',
    createdAt: Date.now().toLocaleString(),
    writer: 'admin',
  },
  {
    reportId: 'AHH002',
    reportName: 'dynamic report 2',
    createdAt: Date.now().toLocaleString(),
    writer: 'admin',
  },
  {
    reportId: 'AHH003',
    reportName: 'dynamic report 3',
    createdAt: Date.now().toLocaleString(),
    writer: 'admin',
  },
]

const Reports: FC = () => {
  const navigate = useNavigate()

  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Report ID</TableHead>
          <TableHead className="w-[65%]">Report Name</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Writer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map(report => (
          <TableRow key={report.reportId} className="cursor-pointer" onClick={() => navigate({ to: `/reports/${[...report.reportId].pop()}` })}>
            <TableCell className="font-medium">{report.reportId}</TableCell>
            <TableCell>{report.reportName}</TableCell>
            <TableCell>{report.createdAt}</TableCell>
            <TableCell>{report.writer}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
