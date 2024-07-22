import { GroupItemValue, ILineItem, ILineItemGroup, IReport } from '@/types';
import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReportProps } from '@/routes/reports/$reportId';
import Grid from '@toast-ui/react-grid';
// import { useCreateTable } from '@/libs/hooks/useCreateTable';
import { v4 as uuidv4 } from 'uuid';
// import { VscDiffRemoved } from 'react-icons/vsc';
import update from 'immutability-helper';
import { VscDiffAdded } from 'react-icons/vsc';

import 'tui-grid/dist/tui-grid.css';
import { GroupCard } from '../ui/card';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const headers = ['Code', 'Name'];

export const Report: FC<ReportProps> = ({ route }) => {
  const report: IReport = route.useLoaderData();

  const [lineItems, setLineItems] = useState<ILineItem[]>([...report.items]);
  const [lineItemGroups, setLineItemsGroups] = useState<ILineItemGroup[]>([]);

  const [colGroup, setColGroup] = useState<ILineItemGroup[]>([]);
  const [rowGroup, setRowGroup] = useState<ILineItemGroup[]>([]);

  const lineItemKeys = useMemo(() => (lineItems.length ? Object.keys(lineItems[0]) : []), [lineItems]);

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
      setRowGroup(
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

  const renderRow = useCallback(
    (group: ILineItemGroup, index: number) => {
      return (
        <GroupCard key={`row-${group.groupId}`} id={uuidv4()} group={group} index={index} onMoveGroup={moveRowGroup} />
      );
    },
    [moveRowGroup],
  );

  const renderColumn = useCallback(
    (group: ILineItemGroup, index: number) => {
      return (
        <GroupCard key={`col-${group.groupId}`} id={uuidv4()} group={group} index={index} onMoveGroup={moveColGroup} />
      );
    },
    [moveColGroup],
  );

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

  const customFields = useMemo(() => {
    return lineItems.filter((item) => item.isCustom === true);
  }, [lineItems]);

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
                    <th key='add-group-btn' className='bg-gray-200 h-[30px]'>
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
                    <th key='LTD(Base)' className='bg-gray-200 h-[30px]'>
                      LTD (Base)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length &&
                    lineItems.map((item, index) => {
                      return (
                        <tr key={uuidv4()} className='border-b border-b-double border-b-neutral-200'>
                          {lineItemKeys.map((key) => {
                            const value = item[key] as unknown as Exclude<GroupItemValue, boolean>;
                            if (key === 'code') {
                              return <td className='px-5'>{value}</td>;
                            } else if (key === 'name') {
                              return (
                                <td className='px-5 text-center border-r border-r-double border-r-neutral-200'>
                                  {value}
                                </td>
                              );
                            } else if (key === 'base' || key === 'isCustom') {
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
              <DraggableCardList
                title='Column'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                customFields={customFields}
                children={colGroup.map((col, i) => renderColumn(col, i))}
              />
              <DraggableCardList
                title='Row'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                customFields={customFields}
                children={rowGroup.map((col, i) => renderRow(col, i))}
              />
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

interface DraggableCardListProps {
  title: string;
  children: ReactNode[];
  groups: ILineItemGroup[];
  setGroups: Dispatch<SetStateAction<ILineItemGroup[]>>;
  customFields: ILineItem[];
}

const DraggableCardList: FC<DraggableCardListProps> = ({ title, children, groups, customFields, setGroups }) => {
  const onSelectHandler = useCallback(
    (value: string) => {
      if (value.length > 9) {
        //group case

        const targetIndex = groups.findIndex((g) => g.groupId === value);
        if (targetIndex !== -1) {
          const targetGroup = groups[targetIndex];
          if (title === 'Row' && targetGroup.axis === 'column') {
            targetGroup.axis = 'row';
            setGroups((prev: ILineItemGroup[]) => {
              return [...prev.slice(0, targetIndex), targetGroup, ...prev.slice(targetIndex + 1)];
            });
          } else if (title === 'Column' && targetGroup.axis === 'row') {
            targetGroup.axis = 'column';
            setGroups((prev: ILineItemGroup[]) => {
              return [...prev.slice(0, targetIndex), targetGroup, ...prev.slice(targetIndex + 1)];
            });
          }
        }
      } else {
        //custom field case
        //TODO
      }
    },
    [groups, setGroups, title],
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='p-3 border rounded'>
        <div className='mb-3 w-[100%] relative flex items-center'>
          <p className='text-lg font-bold text-center'>{title}</p>
          <div className='absolute right-0 flex items-center gap-2'>
            <Select onValueChange={onSelectHandler}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={title === 'Row' ? '행을 선택하세요' : '열을 선택하세요'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {groups.length ? (
                    <>
                      <SelectLabel>Group</SelectLabel>
                      {groups.map((group) => (
                        <SelectItem key={`select_${group.groupId}`} value={group.groupId}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </>
                  ) : null}
                  {customFields.length ? (
                    <>
                      <SelectLabel>Custom Fields</SelectLabel>
                      {customFields.map((field) => (
                        <SelectItem key={field.name} value={field.code}>
                          {field.name}
                        </SelectItem>
                      ))}
                    </>
                  ) : null}
                </SelectGroup>
              </SelectContent>
            </Select>
            <VscDiffAdded className='cursor-pointer' />
          </div>
        </div>
        <div className='flex flex-col gap-3'>{children}</div>
      </div>
    </DndProvider>
  );
};
