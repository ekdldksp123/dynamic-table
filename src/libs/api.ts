import { IReport } from '@/types';
import axios from 'axios';

export const getAllReports = async (): Promise<IReport[]> => {
  const res = await axios.get(`http://localhost:3000/reports`);
  return res.data as unknown as IReport[];
};

export const getReportById = async (reportId: string): Promise<IReport> => {
  const res = await axios.get(`http://localhost:3000/reports?id=${reportId}`);
  const reportConfig = res.data;

  const itemsKey = reportConfig[0].items.length ? Object.keys(reportConfig[0].items[0]) : [];
  //FIXME
  reportConfig[0].itemsDisplayInfo = itemsKey.reduce((acc, cur) => {
    let display = true;
    switch (cur) {
      case 'code':
      case 'name':
      case 'base':
      case 'customFields':
        display = false;
        break;
      case 'value':
        display = true;
        break;
      default:
        display = true;
        break;
    }
    return { ...acc, [cur]: display };
  }, {});
  return reportConfig[0];
};

export const updateReportById = async (id: number, updates: Record<string, unknown>) => {
  await axios
    .patch(`http://localhost:3000/reports/${id}`, updates)
    .then((res) => res)
    .catch((err) => {
      throw err;
    });
};
