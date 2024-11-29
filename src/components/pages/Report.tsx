/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReportProps } from '@/routes/$reportId';
import { v4 as uuidv4 } from 'uuid';
import update from 'immutability-helper';
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
import { DraggableCardList } from '../ui/draggable';
import { Grid } from '../ui/custom-grid-v2';
import { useCreateTableV2 } from '@/libs/hooks/useCreateTableV2';
import { Select } from '../ui/select';

export const Report: FC<ReportProps> = ({ route }) => {
  const report: IReportConfig = route.useLoaderData();

  const [lineItems, setLineItems] = useState<ILineItem[]>([...report.items]);
  const [lineItemGroups, setLineItemsGroups] = useState<ILineItemGroup[]>(report.groups ?? []);

  const [colGroup, setColGroup] = useState<ILineItemGroup[]>([...report.colGroup]);
  const [rowGroup, setRowGroup] = useState<ILineItemGroup[]>([...report.rowGroup]);
  const [valueGroup, setValueGroup] = useState<ILineItemGroup[]>([...report.valueGroup]);

  const [showRowsTotal, setShowRowsTotal] = useState<CheckedState>(report.showRowsTotal ?? false);
  const [showColsTotal, setShowColsTotal] = useState<CheckedState>(report.showColsTotal ?? false);

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

  const moveValueGroup = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragGroup = valueGroup[dragIndex];
      setValueGroup(
        update(valueGroup, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragGroup],
          ],
        }),
      );
    },
    [valueGroup, setValueGroup],
  );

  const removeFromGroups = useCallback(
    (id: string, axis: GroupType) => {
      switch (axis) {
        case 'row':
          setRowGroup((prev) => prev.filter((group) => group.id !== id));
          break;
        case 'column':
          setColGroup((prev) => prev.filter((group) => group.id !== id));
          break;
        case 'value':
          setValueGroup((prev) => prev.filter((group) => group.id !== id));
          break;
        default:
          break;
      }

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
    [lineItemGroups],
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
      const maxGroupLevel = Math.max(...rowGroup.map((g) => g.level ?? -1));
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
      const maxGroupLevel = Math.max(...colGroup.map((g) => g.level ?? -1e));
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
          key={`row-${group.id}`}
          id={uuidv4()}
          group={group}
          index={index}
          onMoveGroup={moveRowGroup}
          onRemoveGroup={removeFromGroups}
          onChangeShowTotal={onChangeRowShowTotal}
          type='row'
        />
      );
    },
    [moveRowGroup, onChangeRowShowTotal, removeFromGroups],
  );

  const renderColumn = useCallback(
    (group: ILineItemGroup, index: number) => {
      return (
        <GroupCard
          key={`col-${group.id}`}
          id={uuidv4()}
          group={group}
          index={index}
          onMoveGroup={moveColGroup}
          onRemoveGroup={removeFromGroups}
          onChangeShowTotal={onChangeColShowTotal}
          type='column'
        />
      );
    },
    [moveColGroup, onChangeColShowTotal, removeFromGroups],
  );

  const renderValue = useCallback(
    (group: ILineItemGroup, index: number) => {
      return (
        <GroupCard
          key={`value-${group.id}`}
          id={uuidv4()}
          group={group}
          index={index}
          onMoveGroup={moveValueGroup}
          onRemoveGroup={removeFromGroups}
          type='column'
        />
      );
    },
    [moveValueGroup, removeFromGroups],
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
  }, [colGroup, lineItemGroups, lineItems, report.id, rowGroup, showColsTotal, showRowsTotal]);

  const renderRowGroups = useMemo(
    () =>
      rowGroup.length
        ? rowGroup.map((row, i) => renderRow(row, i))
        : lineItemGroups.filter((g) => g.type === 'row').map((row, i) => renderRow(row, i)),
    [lineItemGroups, renderRow, rowGroup],
  );
  const renderColGroups = useMemo(
    () =>
      colGroup.length
        ? colGroup.map((col, i) => renderColumn(col, i))
        : lineItemGroups.filter((g) => g.type === 'column').map((col, i) => renderColumn(col, i)),
    [lineItemGroups, renderColumn, colGroup],
  );

  const renderValueGroups = useMemo(
    () =>
      valueGroup.length
        ? valueGroup.map((col, i) => renderValue(col, i))
        : lineItemGroups.filter((g) => g.type === 'value').map((col, i) => renderValue(col, i)),
    [lineItemGroups, renderValue, valueGroup],
  );

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
      colGroup,
      rowGroup,
      valueGroup,
      amountUnit,
      showColsTotal: typeof showColsTotal === 'string' ? false : showColsTotal,
      showRowsTotal: typeof showRowsTotal === 'string' ? false : showRowsTotal,
      fieldHeaders,
      groupHeaders,
    });

    if (!columns.length) {
      alert('적합하지 않은 표현식입니다.');
    } else {
      setPreview({ columns, rows, data, amountUnit });
    }
  }, [
    amountUnit,
    colGroup,
    fieldHeaders,
    getTableData,
    groupHeaders,
    lineItems,
    rowGroup,
    showColsTotal,
    showRowsTotal,
    valueGroup,
  ]);

  useEffect(() => {
    if (!report.rowGroup?.length && !report.colGroup?.length) {
      const rows = [];
      const cols = [];
      for (const group of lineItemGroups) {
        if (group.type === 'row') {
          rows.push(group);
        } else if (group.type === 'column') {
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
            <div className='grid gap-3'>
              <DraggableCardList
                title='Row'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                showTotal={showRowsTotal}
                setShowTotal={setShowRowsTotal}
              >
                {renderRowGroups}
              </DraggableCardList>
              <DraggableCardList
                title='Column'
                groups={lineItemGroups}
                setGroups={setLineItemsGroups}
                showTotal={showColsTotal}
                setShowTotal={setShowColsTotal}
              >
                {renderColGroups}
              </DraggableCardList>
              <DraggableCardList title='Value' groups={lineItemGroups} setGroups={setLineItemsGroups}>
                {renderValueGroups}
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
