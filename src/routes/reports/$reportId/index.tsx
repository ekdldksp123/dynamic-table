/* eslint-disable @typescript-eslint/no-unused-vars */
import supabaseClient from '@/config/supabase'
import { AccountGroup, ReportGroup } from '@/types'
import { createFileRoute } from '@tanstack/react-router'
import { FC, useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

let cccccc = 234112;

export const Route = createFileRoute('/reports/$reportId/')({
  loader: async ({ params }) => {
    const reportId = Number(params.reportId)
    const [reportResult, groupsResult, accountResult, accountGroupsResult] = await Promise.all([
      supabaseClient.from('report').select().eq('id', reportId),
      supabaseClient.from('report_accounts').select('*, report_account_groups!inner(*)').eq('report_id', reportId),
      supabaseClient.from('report_groups').select().eq('report_id', reportId).order('id', { ascending: true }),
      supabaseClient.from('report_account_groups').select('*, report_accounts!inner(*)').eq('report_accounts.report_id', reportId),
    ])

    console.log({reportResult, groupsResult, accountResult, accountGroupsResult})

    return {
      report: reportResult.data?.[0],
      reportGroups: accountResult.data,
      reportAccounts: groupsResult.data,
      accountGroups: accountGroupsResult.data?.reduce((arr, accountGroup) => {
        let ag = arr.find((ar:AccountGroup) => ar.code === accountGroup.report_accounts.code)
        if (!ag) {
          ag = {
            code: accountGroup.report_accounts.code,
            groups: []
          }
          arr.push(ag)
        }

        ag.groups.push({
          id: accountGroup.id,
          groupId: accountGroup.report_group_id,
          value: accountGroup.value,
        })
        return arr
      }, []),
    }
  },
  component: () => <Report/>
})

const headers = ['Code', 'Name']

const Report:FC = () => {
  const { report, reportGroups, reportAccounts, accountGroups } = Route.useLoaderData();

  const [_accountGroups, setAccountGroups] = useState<AccountGroup[]>(accountGroups || []);
  const [_reportGroups, setReportGroups] = useState<ReportGroup[]>(reportGroups || []);

  return (
    <div className="p-5 bg-gray-100">
      <div className="p-5 bg-white">
        <p className="font-bold text-lg">Report Name</p>
        <h2>{report.name}</h2>

        <section className="flex w-[100%]">
          <section className='w-[70%] overflow-x-auto'>
            <p className="mt-5 text-lg font-bold mb-1">Field List</p>
            <div className="overflow-x-auto">
              <table className="whitespace-nowrap">
                <thead>
                  <tr className="border-b border-b-double border-b-zinc-700">
                    {headers.map((header) => <th key={header} className="bg-gray-200 h-[30px]">{header}</th>)}
                    {_reportGroups.map((group) => (
                      <th key={`group-${group.id}`} className="bg-gray-200 h-[30px]">
                        <Input type="text" placeholder={`Group ${_reportGroups.length}`} value={group.label} onChange={(event) => {
                            setReportGroups((prev) => {
                              const rg = prev.find(rg => rg.id === group.id);
                              if(rg) rg.label = event.target.value;
                              return [...prev];
                            });
                          }}
                        />
                      </th>
                    ))}
                    <th>
                      <Button
                        onClick={() => {
                          const groupId = Math.max(..._reportGroups.map(rg => rg.id)) + 1;
                          setAccountGroups((prev) => {
                            prev.forEach((ag) => {
                              ag.groups.push({
                                id: ++cccccc,
                                groupId: groupId,
                                value: '',
                              });
                            });

                            return prev;
                          });

                          setReportGroups(prev => [
                            ...prev,
                            {
                              id: groupId,
                              report_id: report.id,
                              order: 99,
                              show_totals: false,
                              axis: 'row',
                              label: `Group ${_reportGroups.length + 1}`
                            }
                          ]);
                        }}
                      >
                        Add Group
                      </Button>

                    </th>
                  </tr>

                </thead>
                <tbody>
                  {reportAccounts && reportAccounts.map(account => (
                    <tr key={`account-${account.id}`} data-account-code={account.code} className="border">
                      <td className="px-5">
                        {account.code}
                      </td>
                      <td className="px-8 text-center border-r border-r-double border-r-neutral-400">{account.label}</td>
                      {_reportGroups.map((group) => {
                        const accountGroup = _accountGroups.find(ag => ag.code === account.code);
                        const gg = accountGroup?.groups.find(g => g.groupId === group.id);

                        return (
                          <td key={`group-data-${group.id}`}>
                            <input
                              className="text-center"
                              data-account-group-id={group.id}
                              value={String(gg?.value || '')}
                              // onChange={onGroupChange}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className='w-[30%]'>
            <p className="mt-5 text-lg font-bold mb-1">레이아웃 편집</p>
            <div className="flex-col gap-5">
              <div className="p-3 border rounded">
                <p className="mb-3 text-lg font-bold text-center">열</p>
                <ul
                  className="flex flex-col gap-3"
                  data-axis="column"
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  // onDrop={onDrop}
                >

                  {_reportGroups?.filter(rg => rg.axis === 'column').sort((a, b) => a.order - b.order).map(group => (
                    <li
                      key={`group-${group.id}`}
                      className="px-5 py-1 bg-indigo-200"
                      draggable="true"
                      data-group-id={group.id}
                      // onDragStart={(event) => {
                      //   event.currentTarget.classList.add('dragging');
                      //   event.dataTransfer.setData('data', group.id);
                      // }}
                    >
                      {group.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 border rounded">
                <p className="mb-3 text-lg font-bold text-center">행</p>
                <ul
                  className="flex flex-col gap-3"
                  data-axis="row"
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  // onDrop={onDrop}
                >
                  {_reportGroups?.filter(rg => rg.axis === 'row').sort((a, b) => a.order - b.order).map(group => (
                    <li
                      key={`group-${group.id}`}
                      className="px-5 py-1 bg-indigo-200"
                      draggable="true"
                      data-group-id={group.id}
                      onDragStart={(event) => {
                        event.currentTarget.classList.add('dragging');
                        event.dataTransfer.setData('data', group.id.toString());
                      }}
                      onDragEnd={(event) => {
                        event.currentTarget.classList.remove('dragging');
                      }}
                    >
                      {group.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </section>  

        <p className="mt-5 text-lg font-bold">미리보기</p>
        <table>
          <tbody>
            {/* {table.map(row => (
              <tr>
                {row.map(cell => (
                  <td className={`text-center px-2 border${cell[3] === 'header' ? ' bg-indigo-200' : ''}`} rowSpan={cell[1]} colSpan={cell[2]}>{cell[0]}</td>
                ))}
              </tr>
            ))} */}
          </tbody>
        </table>
      </div>
    </div>
  );
}