import { IReportConfig } from '@/types/create-table.v2';
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
  return res.data[0] as IReportConfig;
};

export const updateReportById = async (id: string, updates: Record<string, unknown>) => {
  await instance
    .patch(`reports/${id}`, updates)
    .then((res) => console.log(res.data))
    .catch((err) => {
      console.error(err);
      throw err;
    });
};
