export const subconverterConfig = {
  path: process.env.SUBCONVERTER_PATH || '/usr/local/bin/subconverter',
  port: parseInt(process.env.SUBCONVERTER_PORT || '25500', 10),
  baseUrl: process.env.SUBCONVERTER_URL || 'http://localhost:25500',
  timeout: 15000,
  cacheTtlSeconds: 600, // 10 minutes
  hostTtlDays: 30, // hosted sub link expiry
};
