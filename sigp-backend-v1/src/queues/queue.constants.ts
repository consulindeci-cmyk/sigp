export const QUEUE_NAMES = {
  EXPORTS: 'exports',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
