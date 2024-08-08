/* eslint-disable @typescript-eslint/no-unused-vars */
import { ILineItemGroup } from '@/types';
import { Context, Dispatch, FC, ReactNode, SetStateAction, createContext, useContext, useState } from 'react';

interface IGroupState {
  colGroup: ILineItemGroup[];
  setColGroup: Dispatch<SetStateAction<ILineItemGroup[]>>;
  rowGroup: ILineItemGroup[];
  setRowGroup: Dispatch<SetStateAction<ILineItemGroup[]>>;
}
const GroupStateContext: Context<IGroupState> = createContext<IGroupState>({
  colGroup: [],
  setColGroup: () => {},
  rowGroup: [],
  setRowGroup: () => {},
});

interface GroupStateProviderProps {
  children: ReactNode;
}

export const GroupStateProvider: FC<GroupStateProviderProps> = ({ children }) => {
  const [colGroup, setColGroup] = useState<ILineItemGroup[]>([]);
  const [rowGroup, setRowGroup] = useState<ILineItemGroup[]>([]);

  return (
    <GroupStateContext.Provider value={{ colGroup, setColGroup, rowGroup, setRowGroup }}>
      {children}
    </GroupStateContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGroupState = () => {
  return useContext(GroupStateContext);
};
