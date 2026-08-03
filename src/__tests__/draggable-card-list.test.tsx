import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { DraggableCardList } from '@/components/ui/draggable';
import { ILineItemGroup } from '@/types/create-table.v2';

/** Radix Select / Checkbox 가 jsdom 에서 필요로 하는 것들. */
beforeAll(() => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
});

const groups: ILineItemGroup[] = [
  { id: 'g1', name: '상품', showTotal: false },
  { id: 'g2', name: '자산부채', showTotal: false },
];

describe('DraggableCardList', () => {
  test('축 이름과 카드를 그린다', () => {
    render(
      <DraggableCardList title='Row' groups={groups} onSelectGroup={() => {}}>
        <div>카드 하나</div>
      </DraggableCardList>,
    );

    expect(screen.getByText('Row')).toBeInTheDocument();
    expect(screen.getByText('카드 하나')).toBeInTheDocument();
  });

  test('축별로 다른 안내 문구를 보여준다', () => {
    const { unmount } = render(<DraggableCardList title='Row' groups={groups} onSelectGroup={() => {}} />);
    expect(screen.getByText('행을 선택하세요')).toBeInTheDocument();
    unmount();

    const { unmount: u2 } = render(<DraggableCardList title='Column' groups={groups} onSelectGroup={() => {}} />);
    expect(screen.getByText('열을 선택하세요')).toBeInTheDocument();
    u2();

    render(<DraggableCardList title='Value' groups={groups} onSelectGroup={() => {}} />);
    expect(screen.getByText('값을 선택하세요')).toBeInTheDocument();
  });

  test('총계 콜백을 주면 체크박스가 나오고, 안 주면 나오지 않는다', () => {
    const { unmount } = render(
      <DraggableCardList title='Row' groups={groups} onSelectGroup={() => {}} onChangeShowTotal={() => {}} />,
    );
    expect(screen.getByLabelText('Show Total')).toBeInTheDocument();
    unmount();

    // Value 축에는 총계가 없다.
    render(<DraggableCardList title='Value' groups={groups} onSelectGroup={() => {}} />);
    expect(screen.queryByLabelText('Show Total')).not.toBeInTheDocument();
  });

  test('총계 체크박스를 누르면 콜백이 켜짐 상태로 불린다', () => {
    const onChangeShowTotal = jest.fn();
    render(
      <DraggableCardList
        title='Column'
        groups={groups}
        onSelectGroup={() => {}}
        showTotal={false}
        onChangeShowTotal={onChangeShowTotal}
      />,
    );

    fireEvent.click(screen.getByLabelText('Show Total'));
    expect(onChangeShowTotal).toHaveBeenCalledWith(true);
  });

  /**
   * 그룹 선택(축 이동)은 여기서 테스트하지 않는다. Radix Select 팝업은 pointer
   * capture 에 의존해 jsdom 에서 열리지 않는다. 이 컴포넌트가 하는 일은
   * `<Select onValueChange={onSelectGroup}>` 한 줄의 전달이고, 그 뒤에 실제로
   * 축을 옮기는 로직은 group-axes.test.ts 의 moveGroupToAxis 가 덮는다.
   */
});
