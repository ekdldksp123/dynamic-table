export type ReportGroup = {
  id: number;
  order: number;
  axis: string;
  show_totals: boolean;
  label: string;
};

export type AccountGroup = {
  code: string;
  groups: {
    id: number;
    groupId: number;
    value: string;
  }[];
};

// Report Group + Account Group
export type ReportAccount = {
  id: number;
  code: string;
  label: string;
};
