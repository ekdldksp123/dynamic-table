import { ILineItem, ILineItemGroup, IReport } from '@/types';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReportProps } from '@/routes/reports/$reportId';
import Grid from '@toast-ui/react-grid';
// import { useCreateTable } from '@/libs/hooks/useCreateTable';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
// import { VscDiffRemoved } from 'react-icons/vsc';
import update from 'immutability-helper';

import 'tui-grid/dist/tui-grid.css';
import { GroupCard } from '../ui/card';

const headers = ['Code', 'Name'];

export const Report: FC<ReportProps> = ({ route }) => {
  const report: IReport = route.useLoaderData();

  const [lineItems, setLineItems] = useState<ILineItem[]>([...report.items]);
  const [lineItemGroups, setLineItemsGroups] = useState<ILineItemGroup[]>([]);

  const [colGroup, setColGroup] = useState<ILineItemGroup[]>([]);
  const [rowGroup, setRowGroup] = useState<ILineItemGroup[]>([]);

  const lineItemKeys = useMemo(() => (lineItems.length ? Object.keys(lineItems[0]) : []), [lineItems]);

  useEffect(() => {
    console.log({ lineItemKeys });
  }, [lineItemKeys]);

  //   const { getTableData } = useCreateTable();

  //   useEffect(() => {
  //     console.log({ lineItems, lineItemGroups });
  //   }, [lineItems, lineItemGroups]);

  const moveColGroup = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragGroup = colGroup[dragIndex];
      setColGroup(
        update(colGroup, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragGroup],
          ],
        }),
      );
    },
    [colGroup],
  );

  const moveRowGroup = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragGroup = rowGroup[dragIndex];
      setColGroup(
        update(rowGroup, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragGroup],
          ],
        }),
      );
    },
    [rowGroup],
  );

  const renderRow = (group: ILineItemGroup, index: number) => {
    return <GroupCard key={group.groupId} group={group} index={index} onMoveGroup={moveRowGroup} />;
  };

  const renderColumn = (group: ILineItemGroup, index: number) => {
    return <GroupCard key={group.groupId} group={group} index={index} onMoveGroup={moveColGroup} />;
  };

  useEffect(() => {
    const rows = lineItemGroups.filter((group) => group.axis === 'row').sort((a, b) => b.index - a.index);
    if (rows.length) {
      setRowGroup([...rows]);
    }
    const cols = lineItemGroups.filter((group) => group.axis === 'column').sort((a, b) => b.index - a.index);
    if (cols.length) {
      setColGroup([...cols]);
    }
  }, [lineItemGroups]);

  return (
    <div className='p-5 bg-gray-100'>
      <div className='p-5 bg-white'>
        <p className='font-bold text-lg'>Report Name</p>
        <h2>{report?.name}</h2>
        <section className='flex w-[100%]'>
          <section className='w-[70%] overflow-x-auto'>
            <p className='mt-5 text-lg font-bold mb-1'>Field List</p>
            <div className='overflow-x-auto'>
              <table className='whitespace-nowrap'>
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className='bg-gray-200 h-[30px]'>
                        {header}
                      </th>
                    ))}
                    {lineItemGroups.map((group) => (
                      <th key={`group-${group.name}`} className='bg-gray-200 h-[30px]'>
                        <Input
                          type='text'
                          className='h-[85%]'
                          placeholder={`Group ${lineItemGroups.length}`}
                          value={group.name}
                          onChange={(event) => {
                            setLineItemsGroups((prev) => {
                              const ig = prev.find((ig) => ig.groupId === group.groupId);
                              if (ig) ig.name = event.target.value;
                              return [...prev];
                            });
                          }}
                        />
                      </th>
                    ))}
                    <th key='LTD (Base)' className='bg-gray-200 h-[30px]'>
                      <Button
                        onClick={() => {
                          const groupId = uuidv4();
                          const newItem: ILineItemGroup = {
                            groupId,
                            name: `Group ${lineItemGroups.length + 1}`,
                            index: lineItemGroups.length,
                            show_totals: false,
                            axis: 'row',
                          };
                          setLineItemsGroups((prev) => [...prev, newItem]);
                          setLineItems((prev) =>
                            prev.map((item) => {
                              item[groupId] = null;
                              return item;
                            }),
                          );
                        }}
                      >
                        Add Group
                      </Button>
                    </th>
                    <th key='LTD (Base)' className='bg-gray-200 h-[30px]'>
                      LTD (Base)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length &&
                    lineItems.map((item, index) => {
                      return (
                        <tr key={`lineItem-${index}`} className='border-b border-b-double border-b-neutral-200'>
                          {lineItemKeys.map((key) => {
                            const value = item[key];
                            if (key === 'code') {
                              return <td className='px-5'>{value}</td>;
                            } else if (key === 'name') {
                              return (
                                <td className='px-5 text-center border-r border-r-double border-r-neutral-200'>
                                  {value}
                                </td>
                              );
                            } else if (key === 'base') {
                              return null;
                            } else {
                              return (
                                <td key={`group-data-${key}`}>
                                  <Input
                                    value={value || ''}
                                    onChange={(e) => {
                                      setLineItems((prev) => {
                                        return prev.map((item, i) => {
                                          if (i === index) {
                                            item[key] = e.target.value;
                                          }
                                          return item;
                                        });
                                      });
                                    }}
                                  />
                                </td>
                              );
                            }
                          })}
                          <td className='px-5'></td>
                          <td className='px-5'>{item.base}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
          <section className='w-[30%]'>
            <p className='mt-5 text-lg font-bold mb-1'>Edit Table Layout</p>
            <div className='grid gap-3'>
              <div className='p-3 border rounded'>
                <p className='mb-3 text-lg font-bold text-center'>Column</p>
                <DndProvider backend={HTML5Backend}>
                  <div
                    className='flex flex-col gap-3'
                    // data-axis='column'
                    // onDragOver={(event) => {
                    //   event.preventDefault();
                    // }}
                    // onDrop={onDrop}
                  >
                    {colGroup.map((col, i) => renderColumn(col, i))}
                  </div>
                </DndProvider>
              </div>
              <div className='p-3 border rounded'>
                <p className='mb-3 text-lg font-bold text-center'>Row</p>
                <DndProvider backend={HTML5Backend}>
                  <div
                    className='flex flex-col gap-3'
                    // data-axis='row'
                    // onDragOver={(event) => {
                    //   event.preventDefault();
                    // }}
                    // onDrop={onDrop}
                  >
                    {rowGroup.map((row, i) => renderRow(row, i))}
                  </div>
                </DndProvider>
              </div>
            </div>
          </section>
        </section>
        <p className='mt-5 text-lg font-bold'>Preview</p>
        <Grid
          data={[]}
          columns={[
            {
              header: '구분',
              name: 'group1',
            },
            {
              header: '자산',
              name: 'col1',
            },
            {
              header: '부채',
              name: 'col2',
            },
            {
              header: '자산',
              name: 'col3',
            },
            {
              header: '부채',
              name: 'col4',
            },
          ]}
          header={{
            height: 100, // 50 * 컬럼 group length
            complexColumns: [
              {
                header: '매매목적',
                name: 'group2',
                childNames: ['col1', 'col2'],
              },
              {
                header: '위험회피목적',
                name: 'group3',
                childNames: ['col3', 'col4'],
              },
            ],
          }}
          columnOptions={{ resizable: true }}
          rowHeight={25}
          //   bodyHeight={100}
          //   heightResizable={true}
          //   rowHeaders={['rowNum']}
        />
      </div>
    </div>
  );
};

/**
 * columns: [
    {
      header: 'col1',
      name: 'col1'
    },
    {
      header: 'col2',
      name: 'col2'
    },
    {
      header: 'col3',
      name: 'col3'    
    }
  ],
  header: {
    complexColumns: [
      {
        header: 'col1 + col2',
        name: 'parent1',
        childNames: ['col1', 'col2']            
      },
      {
        header: 'col1 + col2 + col3',
        name: 'parent2',
        childNames: ['parent1', 'col3']
      }
    ]
 */
