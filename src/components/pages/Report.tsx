/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, FC, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReportProps } from '@/routes/reports/$reportId';
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
import { useCreateTable } from '@/libs/hooks/useCreateTable';
import { CustomGrid } from '../ui/custom-grid';
import classNames from 'classnames';
import { updateReportById } from '@/libs/api';
import { ILineItem, ILineItemGroup, IReportConfig, ItemValueType } from '@/types';
import { useGroupState } from '@/shared/groupState.provider';

const EXCLUDE_VALUES = ['전기', '전기말'];

export const Report: FC<ReportProps> = ({ route }) => {
  const report: IReportConfig = route.useLoaderData();

  const [lineItems, setLineItems] = useState<ILineItem[]>([...report.items]);
  const [lineItemGroups, setLineItemsGroups] = useState<ILineItemGroup[]>(report.groups ?? []);

  const { colGroup, setColGroup, rowGroup, setRowGroup } = useGroupState();

  const [showRowsTotal, setShowRowsTotal] = useState<CheckedState>(report.showRowsTotal ?? false);
  const [showColsTotal, setShowColsTotal] = useState<CheckedState>(report.showColsTotal ?? false);
  const [showBaseTotal, setShowBaseTotal] = useState<CheckedState>(report.showColsTotal ?? false);

  const { getBasicGridData, getPivotGridData, getOnlyRowGroupGridData } = useCreateTable();

  const fieldHeaders = useMemo(() => {
    if (lineItems.length) {
      const fieldHeaders = Object.keys(lineItems[0])
        .filter(
          (key) =>
            key !== 'customFields' &&
            key !== 'value' &&
            key !== 'base' &&
            key.length < 20 &&
            !EXCLUDE_VALUES.includes(key),
        )
        .map((key) => {
          return { label: `${key.charAt(0).toUpperCase()}${key.slice(1)}`, value: key };
        });
      return fieldHeaders;
    } else {
      return [];
    }
  }, [lineItems]);

  const headers = useMemo(
    () =>
      Object.keys(report.itemsDisplayInfo)
        .filter((key) => report.itemsDisplayInfo[key] !== false && key.length < 30)
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
      return getOnlyRowGroupGridData({ headers, rowGroup, lineItems, lineItemGroups, showRowsTotal, showBaseTotal });
    }

    // 피봇 테이블 o
    if (colGroup.length && rowGroup.length && lineItems.length) {
      return getPivotGridData({ lineItems, colGroup, rowGroup, showColsTotal, showRowsTotal, showBaseTotal });
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
    getOnlyRowGroupGridData,
    showRowsTotal,
    showBaseTotal,
    getPivotGridData,
    showColsTotal,
  ]);

  const disableShowBaseTotal = useMemo(
    () => lineItems[0].base.length <= 1 || !columns[1].children,
    [columns, lineItems],
  );

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
    [colGroup, setColGroup],
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
    [rowGroup, setRowGroup],
  );

  const removeFromRowGroup = useCallback(
    (groupId: string) => setRowGroup((prev) => [...prev.filter((group) => group.groupId !== groupId)]),
    [setRowGroup],
  );

  const removeFromColGroup = useCallback(
    (groupId: string) => setColGroup((prev) => [...prev.filter((group) => group.groupId !== groupId)]),
    [setColGroup],
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
    [rowGroup, setRowGroup],
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
    [colGroup, setColGroup],
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
          onRemoveGroup={removeFromRowGroup}
          onChangeShowTotal={onChangeRowShowTotal}
        />
      );
    },
    [moveRowGroup, onChangeRowShowTotal, removeFromRowGroup],
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
          onRemoveGroup={removeFromColGroup}
          onChangeShowTotal={onChangeColShowTotal}
        />
      );
    },
    [moveColGroup, onChangeColShowTotal, removeFromColGroup],
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
                ? (item.name as string | undefined)?.split('_')[0]
                : lineItemGroups.length === 1
                  ? item.name === prev[i - 1]?.name
                    ? '부채'
                    : '자산'
                  : (item.name as string | undefined)?.split('_')[1] === '매매'
                    ? '매매목적'
                    : '위험회피목적';
            return item;
          }),
        );
        break;
      case '주석 31_01':
        setLineItems((prev) =>
          prev.map((item, i) => {
            if (lineItemGroups.length === 0) {
              if (item.code === '602000000' || item.code === '704000000') {
                item[groupId] = '기타';
              } else if (item.code === '520010000') {
                item[groupId] = '관계∙종속기업손상차손';
              } else if (item.code === '707000000') {
                item[groupId] = '과징금';
              } else {
                item[groupId] = item.name;
              }
            } else if (lineItemGroups.length === 1) {
              item[groupId] = i < 3 ? '영업외수익' : '영업외비용';
            }
            return item;
          }),
        );
        break;
      case '주석 28_01':
        setLineItems((prev) =>
          prev.map((item) => {
            if (lineItemGroups.length === 0) {
              if (item.code === '52310') {
                item[groupId] = '급여';
              } else if (item.code === '52330') {
                item[groupId] = '복리후생비';
              } else if (item.code === '52320') {
                item[groupId] = '특별상여금';
              } else if (item.code === '52550') {
                item[groupId] = '세금과공과';
              } else if (item.code === '52530' || item.code === '55230' || item.code === '56480') {
                item[groupId] = '지급수수료';
              } else if (item.code === '52520') {
                item[groupId] = '전산비';
              } else if (item.code === '52340') {
                item[groupId] = '퇴직급여';
              } else if (item.code === '52560' || item.code === '56100') {
                item[groupId] = '감가상각비';
              } else {
                item[groupId] = '기타';
              }
            }

            return item;
          }),
        );
        break;
      case '주석 06_01':
        setLineItems((prev) =>
          prev.map((item) => {
            if (lineItemGroups.length === 0) {
              switch (item.code) {
                case '1132000100':
                case '1182003601':
                case '1182004000':
                  item[groupId] = '주식';
                  break;
                case '1182000400':
                case '1182006100':
                case '1182102103':
                  item[groupId] = '출자금';
                  break;
                case '1113002100':
                case '1113002300':
                case '1113003400':
                case '1113004200':
                  item[groupId] = '국공채';
                  break;
                case '1113002303':
                case '1114000100':
                case '1115002004':
                case '1115004004':
                  item[groupId] = '특수채';
                  break;
                case '1113002002':
                  item[groupId] = '금융채';
                  break;
                case '1112000100':
                case '1123102000':
                case '1123103000':
                case '1123105000':
                  item[groupId] = '회사채';
                  break;
                case '1182002000':
                case '1182003000':
                case '1182003200':
                case '1183100400':
                  item[groupId] = '수익증권';
                  break;
                default:
                  item[groupId] = '외화유가증권';
                  break;
              }
            } else if (lineItemGroups.length === 1) {
              switch (item.code) {
                case '1132000100':
                case '1182003601':
                case '1182004000':
                case '1182000400':
                case '1182006100':
                case '1182102103':
                  item[groupId] = '지분상품';
                  break;
                default:
                  item[groupId] = '채무상품';
                  break;
              }
            } else if (lineItemGroups.length === 2) {
              item[groupId] = '장부금액';
            }
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

  const onSaveHandler = useCallback(async () => {
    const newReport = {
      items: lineItems,
      groups: lineItemGroups,
      colGroup,
      rowGroup,
      showRowsTotal,
      showColsTotal,
      showBaseTotal,
    };
    try {
      await updateReportById(report.id, newReport);
      alert('report config saved!');
    } catch (error) {
      alert(`failed to save report config :: ${(error as Error).message}`);
    }
  }, [colGroup, lineItemGroups, lineItems, report.id, rowGroup, showBaseTotal, showColsTotal, showRowsTotal]);

  const renderRowGroups = useMemo(
    () => lineItemGroups.filter((g) => g.axis === 'row').map((col, i) => renderRow(col, i)),
    [lineItemGroups, renderRow],
  );
  const renderColGroups = useMemo(
    () => lineItemGroups.filter((g) => g.axis === 'column').map((col, i) => renderColumn(col, i)),
    [lineItemGroups, renderColumn],
  );

  useEffect(() => {
    if (!report.rowGroup?.length && !report.colGroup?.length) {
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
    } else {
      setRowGroup(report.rowGroup ?? []);
      setColGroup(report.colGroup ?? []);
    }
  }, [
    lineItemGroups,
    report.colGroup,
    report.colGroup?.length,
    report.rowGroup,
    report.rowGroup?.length,
    setColGroup,
    setRowGroup,
  ]);

  return (
    <div className='p-5 bg-gray-100'>
      <div className='p-5 bg-white'>
        <div className='flex relative w-[100%]'>
          <p className='font-bold text-lg'>Report Name</p>
          <Button className='absolute right-0 px-5' onClick={onSaveHandler}>
            Save
          </Button>
        </div>

        <h2>{report?.name}</h2>
        <section className='flex gap-3 w-[100%] h-[550px] overflow-y-auto'>
          <section className='w-[80%] overflow-x-auto'>
            <p className='mt-5 text-lg font-bold mb-1'>Field List</p>
            <div className='overflow-x-auto'>
              <table className='w-[100%] whitespace-nowrap'>
                <thead className='w-[100%]'>
                  <tr>
                    {fieldHeaders.map((header) => (
                      <th key={`th-${header.label}`} className='bg-gray-200 h-[30px]'>
                        {header.label}
                      </th>
                    ))}
                    {lineItemGroups.map((group, index) => (
                      <th key={`group-${group.groupId}`} className='bg-gray-200 h-[30px]'>
                        <div className='w-[100%] relative flex items-center gap-2'>
                          <Input
                            type='text'
                            className='w-[150px]'
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
                        <tr key={`${index}-${item.code}`} className='border-b border-b-double border-b-neutral-200'>
                          {fieldHeaders.map((header) => {
                            const value = item[header.value];
                            return (
                              <td className={classNames('px-5 text-center', value === null && 'italic text-gray-400')}>
                                {typeof value === 'number'
                                  ? value.toLocaleString()
                                  : value !== null
                                    ? value
                                    : '( 사용자 입력 항목 )'}
                              </td>
                            );
                          })}
                          {lineItemGroups.map(({ groupId }) => {
                            const value = item[groupId] as unknown as Exclude<ItemValueType, boolean>;
                            return (
                              <td key={`${item.code}:${groupId}`}>
                                <Input
                                  value={value || ''}
                                  className='w-[150px]'
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
                          <td className='px-5'>{item.base.join(', ')}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <section className='w-[20%]'>
            <p className='mt-5 text-lg font-bold mb-1'>Edit Table Layout</p>
            <div className='grid gap-3'>
              <DraggableCardList
                title='Row'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                children={renderRowGroups}
                showTotal={showRowsTotal}
                setShowTotal={setShowRowsTotal}
                // separateGroups={separateGroups}
              />
              <DraggableCardList
                title='Column'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                children={renderColGroups}
                showTotal={showColsTotal}
                setShowTotal={setShowColsTotal}
                disableShowBaseTotal={disableShowBaseTotal}
                showBaseTotal={showBaseTotal}
                setShowBaseTotal={setShowBaseTotal}
                // separateGroups={separateGroups}
              />
            </div>
          </section>
        </section>
        <div className='w-[100%] h-[50px] relative mb-2'>
          <p className='mt-5 text-lg font-bold'>Preview</p>
          <p className='absolute right-0 text-md font-medium'>Unit (1,000 won)</p>
        </div>
        <CustomGrid columns={columns} rows={rows} numOfRowGroups={rowGroup.length} />
      </div>
    </div>
  );
};

interface DraggableCardListProps {
  title: string;
  children: ReactNode[];
  groups: ILineItemGroup[];
  setGroups: Dispatch<SetStateAction<ILineItemGroup[]>>;
  showTotal: CheckedState;
  setShowTotal: (state: CheckedState) => void;
  showBaseTotal?: CheckedState;
  setShowBaseTotal?: (state: CheckedState) => void;
  disableShowBaseTotal?: boolean;
}

const DraggableCardList: FC<DraggableCardListProps> = ({
  title,
  children,
  groups,
  setGroups,
  showTotal,
  setShowTotal,
  disableShowBaseTotal,
  showBaseTotal,
  setShowBaseTotal,
}) => {
  const [target, setTarget] = useState<string>();
  const onAddHandler = useCallback(() => {
    if (!target) return;

    const targetIndex = groups.findIndex((g) => g.groupId === target);

    if (targetIndex === -1) return;
    const targetGroup = { ...groups[targetIndex] };

    targetGroup.axis = title === 'Row' ? 'row' : 'column';
    setGroups((prev) => {
      prev[targetIndex] = targetGroup;
      return [...prev];
    });
  }, [groups, setGroups, target, title]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className='p-3 border rounded'>
        <div className='mb-3 w-[100%] relative flex items-center'>
          <p className='text-lg font-bold text-center'>{title}</p>
          <div className='absolute right-0 flex items-center gap-2'>
            <Select onValueChange={setTarget} value={target}>
              <SelectTrigger className='w-[150px]'>
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
                </SelectGroup>
              </SelectContent>
            </Select>
            <VscDiffAdded className='cursor-pointer' onClick={onAddHandler} />
          </div>
        </div>
        <div className='flex flex-col gap-3'>
          {children}
          <div className='flex gap-8'>
            <CheckboxGroup
              id={title === 'Row' ? 'rowTotal' : 'columnTotal'}
              label='Show Total'
              disabled={!children.length}
              checked={showTotal}
              onCheckedChange={setShowTotal}
            />
            {title === 'Column' && (
              <CheckboxGroup
                id='baseTotal'
                label='Show Base Total'
                disabled={disableShowBaseTotal}
                checked={showBaseTotal}
                onCheckedChange={setShowBaseTotal}
              />
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
