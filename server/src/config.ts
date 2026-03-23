import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  maxDateRangeDays: Number(process.env.MAX_DATE_RANGE_DAYS ?? 730),
  ssrs: {
    baseUrl: process.env.SSRS_BASE_URL ?? '',
    reportPath: process.env.SSRS_REPORT_PATH ?? '',
    username: process.env.SSRS_USERNAME ?? '',
    password: process.env.SSRS_PASSWORD ?? '',
    domain: process.env.SSRS_DOMAIN ?? '',
    format: (process.env.SSRS_FORMAT ?? 'csv').toLowerCase() as 'csv' | 'json' | 'xml'
  },
  db: {
    server: process.env.DB_SERVER ?? '',
    database: process.env.DB_DATABASE ?? '',
    user: process.env.DB_USER ?? '',
    password: process.env.DB_PASSWORD ?? '',
    encrypt: (process.env.DB_ENCRYPT ?? 'true').toLowerCase() === 'true'
  },
  getRequired: required
};