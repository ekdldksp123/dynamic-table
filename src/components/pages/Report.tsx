/* eslint-disable @typescript-eslint/no-explicit-any */
import { ItemValueType, ILineItem, ILineItemGroup, IReport, GridRowData } from '@/types';
import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReportProps } from '@/routes/reports/$reportId';
import { useCreateTable } from '@/libs/hooks/useCreateTable';
import { v4 as uuidv4 } from 'uuid';
import update from 'immutability-helper';
import { VscDiffAdded, VscDiffRemoved } from 'react-icons/vsc';

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
import { CheckedState } from '@radix-ui/react-checkbox';
import { CheckboxGroup } from '../ui/checkbox';
import { DataGrid } from '../ui/tanstack-grid';
import { ColumnDef } from '@tanstack/react-table';

const HEADERS_TO_EXCLLUDE = ['전기', '전기말'];
const field_headers = ['Code', 'Name'];

export const Report: FC<ReportProps> = ({ route }) => {
  const report: IReport = route.useLoaderData();

  const [lineItems, setLineItems] = useState<ILineItem[]>([...report.items]);
  const [lineItemGroups, setLineItemsGroups] = useState<ILineItemGroup[]>(report.groups ?? []);

  const [colGroup, setColGroup] = useState<ILineItemGroup[]>(report.colGroup ?? []);
  const [rowGroup, setRowGroup] = useState<ILineItemGroup[]>(report.rowGroup ?? []);

  const [showRowsTotal, setShowRowsTotal] = useState<CheckedState>(report.showRowsTotal ?? false);
  const [showColsTotal, setShowColsTotal] = useState<CheckedState>(report.showColsTotal ?? false);

  const { getBasicGridData, getPivotGridData } = useCreateTable();
  const headers = useMemo(
    () =>
      Object.keys(report.itemsDisplayInfo)
        .filter((key) => report.itemsDisplayInfo[key] === true && !HEADERS_TO_EXCLLUDE.includes(key))
        .map((key) => `${key.charAt(0).toUpperCase()}${key.slice(1)}`),

    [report.itemsDisplayInfo],
  );

  const { columns, rows } = useMemo(() => {
    // 행열이 정의 되어있지 않은 경우
    if (!colGroup.length && !rowGroup.length && lineItems.length) {
      return getBasicGridData({ headers, lineItems, lineItemGroups });
    }

    // 행만 그룹으로 정의되어 있는 경우 + 열이 없어서 당기말, 전기말 표시 필수
    if (!colGroup.length && rowGroup.length && lineItems.length) {
      return {
        columns: [],
        rows: [],
      };
    }

    // 피봇 테이블 o
    if (colGroup.length && rowGroup.length && lineItems.length) {
      return getPivotGridData({ lineItems, colGroup, rowGroup, showColsTotal, showRowsTotal });
    }
    return {
      columns: [],
      rows: [],
    };
  }, [
    colGroup,
    rowGroup,
    lineItems,
    getBasicGridData,
    headers,
    lineItemGroups,
    getPivotGridData,
    showColsTotal,
    showRowsTotal,
  ]);

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

  const onChangeRowShowTotal = useCallback(
    (index: number, showTotal: CheckedState) => {
      setRowGroup((prev) => {
        if (typeof showTotal === 'boolean') {
          prev[index].showTotal = showTotal;
          return [...prev];
        }
        return prev;
      });

      const groupLevel = rowGroup[index].level;
      const maxGroupLevel = Math.max(...rowGroup.map((g) => g.level));
      if (groupLevel === maxGroupLevel) {
        setShowRowsTotal(showTotal);
      }
    },
    [rowGroup],
  );

  const onChangeColShowTotal = useCallback(
    (index: number, showTotal: CheckedState) => {
      setColGroup((prev) => {
        if (typeof showTotal === 'boolean') {
          prev[index].showTotal = showTotal;
          return [...prev];
        }
        return prev;
      });

      const groupLevel = colGroup[index].level;
      const maxGroupLevel = Math.max(...colGroup.map((g) => g.level));
      if (groupLevel === maxGroupLevel) {
        setShowColsTotal(showTotal);
      }
    },
    [colGroup],
  );

  const renderRow = useCallback(
    (group: ILineItemGroup, index: number) => {
      return (
        <GroupCard
          key={`row-${group.groupId}`}
          id={uuidv4()}
          group={group}
          index={index}
          onMoveGroup={moveRowGroup}
          onChangeShowTotal={onChangeRowShowTotal}
        />
      );
    },
    [moveRowGroup, onChangeRowShowTotal],
  );

  const renderColumn = useCallback(
    (group: ILineItemGroup, index: number) => {
      return (
        <GroupCard
          key={`col-${group.groupId}`}
          id={uuidv4()}
          group={group}
          index={index}
          onMoveGroup={moveColGroup}
          onChangeShowTotal={onChangeColShowTotal}
        />
      );
    },
    [moveColGroup, onChangeColShowTotal],
  );

  const onAddGroup = useCallback(() => {
    const groupId = uuidv4();
    const newItem: ILineItemGroup = {
      groupId,
      name: `Group ${lineItemGroups.length + 1}`,
      level: lineItemGroups.length + 1,
      showTotal: false,
    };
    setLineItemsGroups((prev) => [...prev, newItem]);

    switch (report.name) {
      case '주석 10_01':
        setLineItems((prev) =>
          prev.map((item, i) => {
            item[groupId] =
              lineItemGroups.length === 0
                ? item.name.split('_')[0]
                : lineItemGroups.length === 1
                  ? item.name === prev[i - 1]?.name
                    ? '부채'
                    : '자산'
                  : item.name.split('_')[1] === '매매'
                    ? '매매목적'
                    : '위험회피목적';
            return item;
          }),
        );
        break;
      default:
        setLineItems((prev) =>
          prev.map((item) => {
            item[groupId] = null;
            return item;
          }),
        );
        break;
    }
  }, [lineItemGroups.length, report.name]);

  const deleteGroup = useCallback(() => {
    const lastKey = lineItemGroups[lineItemGroups.length - 1].groupId;
    setLineItemsGroups((prev) => {
      return prev.slice(0, -1);
    });
    setLineItems((prev) =>
      prev.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [lastKey]: _, ...rest } = item;
        return rest as unknown as ILineItem;
      }),
    );
  }, [lineItemGroups]);

  const customFields = useMemo(() => {
    return lineItems.filter((item) => item.isCustom === true);
  }, [lineItems]);

  useEffect(() => {
    const rows = [];
    const cols = [];
    for (const group of lineItemGroups) {
      if (group.axis === 'row') {
        rows.push(group);
      } else if (group.axis === 'column') {
        cols.push(group);
      }
    }

    if (rows.length) setRowGroup(rows);
    if (cols.length) setColGroup(cols);
  }, [lineItemGroups]);

  return (
    <div className='p-5 bg-gray-100'>
      <div className='p-5 bg-white'>
        <p className='font-bold text-lg'>Report Name</p>
        <h2>{report?.name}</h2>
        <section className='flex gap-3 w-[100%] h-[550px] overflow-y-auto'>
          <section className='w-[70%] overflow-x-auto'>
            <p className='mt-5 text-lg font-bold mb-1'>Field List</p>
            <div className='overflow-x-auto'>
              <table className='whitespace-nowrap'>
                <thead>
                  <tr>
                    {field_headers.map((header) => (
                      <th key={header} className='bg-gray-200 h-[30px]'>
                        {header}
                      </th>
                    ))}
                    {lineItemGroups.map((group, index) => (
                      <th key={`group-${group.groupId}`} className='bg-gray-200 h-[30px]'>
                        <div className='w-[100%] relative flex items-center gap-2'>
                          <Input
                            type='text'
                            className='w-[85%]'
                            placeholder={`Group ${lineItemGroups.length}`}
                            value={group.name}
                            onChange={(e) => {
                              setLineItemsGroups((prev) => {
                                const targetGroup = prev.find((g) => g.groupId === group.groupId);
                                if (targetGroup) targetGroup.name = e.target.value;
                                return [...prev];
                              });
                            }}
                          />
                          {index === lineItemGroups.length - 1 ? (
                            <VscDiffRemoved className='absolute right-0 cursor-pointer' onClick={deleteGroup} />
                          ) : null}
                        </div>
                      </th>
                    ))}
                    <th key='add-group-btn' className='bg-gray-200 h-[30px]'>
                      <Button onClick={onAddGroup}>Add Group</Button>
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
                        <tr key={`item-${index}`} className='border-b border-b-double border-b-neutral-200'>
                          <td className='px-5'>{item.code}</td>
                          <td className='px-5 text-center border-r border-r-double border-r-neutral-200'>
                            {item.name}
                          </td>
                          {lineItemGroups.map(({ groupId }) => {
                            const value = item[groupId] as unknown as Exclude<ItemValueType, boolean>;
                            return (
                              <td key={`${item.code}:${groupId}`}>
                                <Input
                                  value={value || ''}
                                  className='w-[85%]'
                                  onChange={(e) => {
                                    setLineItems((prev) => {
                                      return prev.map((item, i) => {
                                        if (i === index) {
                                          item[groupId] = e.target.value;
                                        }
                                        return item;
                                      });
                                    });
                                  }}
                                />
                              </td>
                            );
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
                title='Row'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                customFields={customFields}
                children={rowGroup.map((col, i) => renderRow(col, i))}
                showTotal={showRowsTotal}
                setShowTotal={setShowRowsTotal}
              />
              <DraggableCardList
                title='Column'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                customFields={customFields}
                children={colGroup.map((col, i) => renderColumn(col, i))}
                showTotal={showColsTotal}
                setShowTotal={setShowColsTotal}
              />
            </div>
          </section>
        </section>
        <p className='mt-5 text-lg font-bold'>Preview</p>
        <DataGrid columns={columns as ColumnDef<GridRowData, unknown>[]} data={rows} />
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
  showTotal: CheckedState;
  setShowTotal: (state: CheckedState) => void;
}

const DraggableCardList: FC<DraggableCardListProps> = ({
  title,
  children,
  groups,
  customFields,
  setGroups,
  showTotal,
  setShowTotal,
}) => {
  const [target, setTarget] = useState<string>();
  const onAddHandler = useCallback(() => {
    if (!target) return;
    if (target.length > 9) {
      //group case

      const targetIndex = groups.findIndex((g) => g.groupId === target);
      if (targetIndex !== -1) {
        const targetGroup = groups[targetIndex];
        if (title === 'Row' && targetGroup.axis !== 'row') {
          targetGroup.axis = 'row';
          setGroups((prev) => {
            prev[targetIndex] = targetGroup;
            return [...prev];
          });
        } else if (title === 'Column' && targetGroup.axis !== 'column') {
          targetGroup.axis = 'column';
          setGroups((prev: ILineItemGroup[]) => {
            prev[targetIndex] = targetGroup;
            return [...prev];
          });
        }
      }
    } else {
      //custom field case
      //TODO
    }
    return setTarget(undefined);
  }, [groups, setGroups, target, title]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='p-3 border rounded'>
        <div className='mb-3 w-[100%] relative flex items-center'>
          <p className='text-lg font-bold text-center'>{title}</p>
          <div className='absolute right-0 flex items-center gap-2'>
            <Select onValueChange={setTarget} value={target}>
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
            <VscDiffAdded className='cursor-pointer' onClick={onAddHandler} />
          </div>
        </div>
        <div className='flex flex-col gap-3'>
          {children}
          <CheckboxGroup
            id={title === 'Row' ? 'rowTotal' : 'columnTotal'}
            label='Show Total'
            // disabled={!children.length}
            checked={showTotal}
            onCheckedChange={setShowTotal}
          />
        </div>
      </div>
    </DndProvider>
  );
};
