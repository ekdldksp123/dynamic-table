/* eslint-disable @typescript-eslint/no-unused-vars */
import supabaseClient from '@/config/supabase'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/reports/$reportId/')({
  loader: async ({ params }) => {
    const reportId = Number(params.reportId)
    const [reportResult, groupsResult, accountResult, accountGroupsResult] = await Promise.all([
      supabaseClient.from('report').select().eq('id', reportId),
      supabaseClient.from('report_accounts').select('*, report_account_groups!inner(*)').eq('report_id', reportId),
      supabaseClient.from('report_groups').select().eq('report_id', reportId).order('id', { ascending: true }),
      supabaseClient.from('report_account_groups').select('*, report_accounts!inner(*)').eq('report_accounts.report_id', reportId),
    ])
  },
  component: () => <div>/reports/$reportsId/!</div>
})
