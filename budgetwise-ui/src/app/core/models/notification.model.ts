export interface AppNotification {
  id: string;
  userId: string;
  scheduledTransactionId: string | null;
  type: 'SCHEDULED_TX_DUE';
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}
