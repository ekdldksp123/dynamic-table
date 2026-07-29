import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReportProps } from '@/routes/$reportId';
import { v4 as uuidv4 } from 'uuid';
import { VscDiffRemoved } from 'react-icons/vsc';

import { GroupCard } from '../ui/card';
import { CheckedState } from '@radix-ui/react-checkbox';
import classNames from 'classnames';
import {
  GridData,
  GridGroup,
  GroupType,
  ILineItem,
  ILineItemGroup,
  IReportConfig,
  ItemValueType,
} from '@/types/create-table.v2';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableCardList } from '../ui/draggable';
import { Grid } from '../ui/custom-grid-v2';
import { useCreateTableV2 } from '@/libs/hooks/useCreateTableV2';
import { GroupAxes, useGroupAxes } from '@/libs/hooks/useGroupAxes';
import { Select } from '../ui/select';

/** 체크박스는 'indeterminate' 도 낼 수 있지만, 집계는 켜짐/꺼짐만 안다. */
const asBoolean = (checked: CheckedState | undefined) => checked === true;

export const Report: FC<ReportProps> = ({ route }) => {
  const report: IReportConfig = route.useLoaderData();

  const [lineItems, setLineItems] = useState<ILineItem[]>([...(report.items ?? [])]);
  const [lineItemGroups, setLineItemsGroups] = useState<ILineItemGroup[]>(report.groups ?? []);

  const { axes, setAxis, moveGroup, removeGroup, setGroupShowTotal, maxLevelOf } = useGroupAxes({
    row: [...(report.rowGroup ?? [])],
    column: [...(report.colGroup ?? [])],
    value: [...(report.valueGroup ?? [])],
  });

  // 값 축에는 총계가 없다.
  const [axisTotals, setAxisTotals] = useState<Partial<Record<GroupType, CheckedState>>>({
    row: report.showRowsTotal ?? false,
    column: report.showColsTotal ?? false,
  });

  const setAxisTotal = useCallback((type: GroupType, showTotal: CheckedState) => {
    setAxisTotals((prev) => ({ ...prev, [type]: showTotal }));
  }, []);

  const [amountUnit, setAmountUnit] = useState<number>(1);

  const { getTableData } = useCreateTableV2();

  const fieldHeaders = useMemo(
    () =>
      lineItems.length
        ? Object.keys(lineItems[0]).filter((key) => key !== 'id' && key !== 'base' && key.length < 30)
        : [],
    [lineItems],
  );

  const groupHeaders = useMemo(
    () =>
      lineItemGroups.length
        ? lineItemGroups.filter(({ name }) => name !== 'id' && name !== 'base' && !fieldHeaders.includes(name))
        : [],
    [fieldHeaders, lineItemGroups],
  );

  const removeFromGroups = useCallback(
    (id: string, axis: GroupType) => {
      removeGroup(axis, id);

      if (lineItemGroups.find((group) => group.id === id)) {
        setLineItemsGroups((prev) =>
          prev.map((group) => {
            if (group.id === id && group.type) {
              group.type = undefined;
              return group;
            }
            return group;
          }),
        );
      }
    },
    [lineItemGroups, removeGroup],
  );

  const onChangeShowTotal = useCallback(
    (type: GroupType, index: number, showTotal: CheckedState) => {
      if (typeof showTotal === 'boolean') {
        setGroupShowTotal(type, index, showTotal);
      }

      // 가장 깊은 그룹의 소계는 그 축 전체의 총계와 같다.
      if (axes[type][index].level === maxLevelOf(type)) {
        setAxisTotal(type, showTotal);
      }
    },
    [axes, maxLevelOf, setAxisTotal, setGroupShowTotal],
  );

  const renderGroupCard = useCallback(
    (type: GroupType) => (group: ILineItemGroup, index: number) => (
      <GroupCard
        key={`${type}-${group.id}`}
        id={uuidv4()}
        group={group}
        index={index}
        onMoveGroup={(dragIndex, hoverIndex) => moveGroup(type, dragIndex, hoverIndex)}
        onRemoveGroup={removeFromGroups}
        onChangeShowTotal={type === 'value' ? undefined : (i, v) => onChangeShowTotal(type, i, v)}
        type={type}
      />
    ),
    [moveGroup, onChangeShowTotal, removeFromGroups],
  );

  const renderGroups = useCallback(
    (type: GroupType) => {
      const groups = axes[type].length ? axes[type] : lineItemGroups.filter((group) => group.type === type);
      return groups.map(renderGroupCard(type));
    },
    [axes, lineItemGroups, renderGroupCard],
  );

  const onAddGroup = useCallback(() => {
    const id = uuidv4();
    const newItem: ILineItemGroup = {
      id,
      name: `Group ${lineItemGroups.length + 1}`,
      level: lineItemGroups.length + 1,
      showTotal: false,
    };
    setLineItemsGroups((prev) => [...prev, newItem]);
  }, [lineItemGroups.length]);

  const deleteGroup = useCallback(() => {
    const lastKey = lineItemGroups[lineItemGroups.length - 1].id;
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
    //FIXME
    // const newReport = {
    //   items: lineItems,
    //   groups: lineItemGroups,
    //   colGroup,
    //   rowGroup,
    //   showRowsTotal,
    //   showColsTotal,
    //   showBaseTotal,
    // };
    // try {
    //   await updateReportById(report.id, newReport);
    //   alert('report config saved!');
    // } catch (error) {
    //   alert(`failed to save report config :: ${(error as Error).message}`);
    // }
    // 본문이 아직 주석 상태이므로 의존성도 비워둔다. 되살릴 때 eslint 가
    // 필요한 값을 다시 알려준다.
  }, []);

  const [preview, setPreview] = useState<{
    columns: GridGroup[];
    rows: GridGroup[];
    data: GridData[];
    amountUnit: number;
  }>();

  const renderGrid = useMemo(() => {
    return preview?.columns && preview?.rows && preview?.data ? (
      <Grid
        columns={preview.columns}
        rows={preview.rows}
        data={preview.data}
        amountUnit={preview.amountUnit.toLocaleString()}
      />
    ) : null;
  }, [preview]);

  const onClickPreview = useCallback(() => {
    const { columns, rows, data } = getTableData({
      lineItems,
      colGroup: axes.column,
      rowGroup: axes.row,
      valueGroup: axes.value,
      amountUnit,
      showColsTotal: asBoolean(axisTotals.column),
      showRowsTotal: asBoolean(axisTotals.row),
      fieldHeaders,
      groupHeaders,
    });

    if (!columns.length) {
      alert('적합하지 않은 표현식입니다.');
    } else {
      setPreview({ columns, rows, data, amountUnit });
    }
  }, [amountUnit, axes, axisTotals, fieldHeaders, getTableData, groupHeaders, lineItems]);

  useEffect(() => {
    if (!report.rowGroup?.length && !report.colGroup?.length) {
      const seeded: Partial<GroupAxes> = {};
      for (const group of lineItemGroups) {
        if (group.type === 'row' || group.type === 'column') {
          seeded[group.type] = [...(seeded[group.type] ?? []), group];
        }
      }

      for (const type of ['row', 'column'] as const) {
        if (seeded[type]?.length) setAxis(type, seeded[type]);
      }
    } else {
      setAxis('row', report.rowGroup ?? []);
      setAxis('column', report.colGroup ?? []);
    }
  }, [lineItemGroups, report.colGroup, report.rowGroup, setAxis]);

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
                      <th key={`th-${header}`} className='bg-gray-200 h-[30px]'>
                        {header}
                      </th>
                    ))}
                    {lineItemGroups.map((group, index) => (
                      <th key={`group-${group.id}`} className='bg-gray-200 h-[30px]'>
                        <div className='w-[100%] relative flex items-center gap-2'>
                          <Input
                            type='text'
                            className='w-[150px]'
                            placeholder={`Group ${lineItemGroups.length}`}
                            value={group.name}
                            onChange={(e) => {
                              setLineItemsGroups((prev) => {
                                const targetGroup = prev.find((g) => g.id === group.id);
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
                            const value = item[header];
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
                          {lineItemGroups.map(({ id }) => {
                            const value = item[id] as unknown as Exclude<ItemValueType, boolean>;
                            return (
                              <td key={`${item.code}:${id}`}>
                                <Input
                                  value={value || ''}
                                  className='w-[150px]'
                                  onChange={(e) => {
                                    setLineItems((prev) => {
                                      return prev.map((item, i) => {
                                        if (i === index) {
                                          item[id] = e.target.value;
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
                          <td className='px-5'>{item.base ?? ''}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <section className='w-[20%]'>
            <p className='mt-5 text-lg font-bold mb-1'>Edit Table Layout</p>
            <DndProvider backend={HTML5Backend}>
              <div className='grid gap-3'>
                <DraggableCardList
                  title='Row'
                  groups={lineItemGroups}
                  setGroups={setLineItemsGroups}
                  showTotal={axisTotals.row}
                  onChangeShowTotal={(showTotal) => setAxisTotal('row', showTotal)}
                >
                  {renderGroups('row')}
                </DraggableCardList>
                <DraggableCardList
                  title='Column'
                  groups={lineItemGroups}
                  setGroups={setLineItemsGroups}
                  showTotal={axisTotals.column}
                  onChangeShowTotal={(showTotal) => setAxisTotal('column', showTotal)}
                >
                  {renderGroups('column')}
                </DraggableCardList>
                <DraggableCardList title='Value' groups={lineItemGroups} setGroups={setLineItemsGroups}>
                  {renderGroups('value')}
                </DraggableCardList>
                <div className='p-3 w-[100%] flex justify-between'>
                  <p>Amount Unit</p>
                  <Select onValueChange={(v) => setAmountUnit(Number(v))} defaultValue={'1'}>
                    <option value='10000'>10,000</option>
                    <option value='1000'>1,000</option>
                    <option value='1'>1</option>
                  </Select>
                </div>
              </div>
            </DndProvider>
          </section>
        </section>
        <div className='w-[100%] flex items-end justify-between mb-2'>
          <p className='mt-5 text-lg font-bold'>Report</p>
          <Button onClick={onClickPreview}>Preview</Button>
        </div>
        {renderGrid}
      </div>
    </div>
  );
};
