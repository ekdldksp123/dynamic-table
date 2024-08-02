import { IReportConfig } from '@/types';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAllReports = async (): Promise<IReportConfig[]> => {
  const res = await instance.get('reports');
  return res.data as unknown as IReportConfig[];
};

export const getReportById = async (reportId: string): Promise<IReportConfig> => {
  const res = await instance.get(`reports?id=${reportId}`);
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
  await instance
    .patch(`reports/${id}`, updates)
    .then((res) => res)
    .catch((err) => {
      throw err;
    });
};
