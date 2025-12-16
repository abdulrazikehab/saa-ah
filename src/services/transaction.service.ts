import { apiClient } from './core/api-client';

export interface Transaction {
  id: string;
  orderNumber?: string;
  amount: number;
  platformFee: number;
  merchantEarnings: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentProvider: string;
  paymentMethodType?: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  processedAt?: string;
  settledAt?: string;
  createdAt: string;
  // Card details
  cardNumber?: string;
  cardBin?: string;
  cardLast4?: string;
  // Print tracking
  printCount?: number;
}

export interface BalanceSummary {
  totalRevenue: number;
  totalPlatformFees: number;
  totalEarnings: number;
  pendingAmount: number;
  availableBalance: number;
  currency: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  totalEarnings: number;
  byProvider: Record<string, { count: number; amount: number }>;
  byDate: Array<{
    date: string;
    count: number;
    amount: number;
    fees: number;
    earnings: number;
  }>;
}

export interface SubscriptionInfo {
  plan: string;
  monthlyPrice: number;
  features: string[];
  nextBillingDate: string;
  daysUntilBilling: number;
  shouldAlert: boolean;
}

export const transactionService = {
  getBalance: (tenantId: string): Promise<BalanceSummary> =>
    apiClient.get('/transactions/balance', {
      requireAuth: true,
      params: { tenantId }
    } as any),

  getTransactions: (tenantId: string, params?: any): Promise<{ transactions: Transaction[]; total: number }> => {
    const queryParams = new URLSearchParams({ tenantId, ...params }).toString();
    return apiClient.get(`/transactions?${queryParams}`, {
      requireAuth: true,
    });
  },

  getTransaction: (tenantId: string, id: string): Promise<Transaction> =>
    apiClient.get(`/transactions/${id}?tenantId=${tenantId}`, {
      requireAuth: true,
    }),

  getStats: (tenantId: string, startDate?: string, endDate?: string): Promise<TransactionStats> => {
    const params: any = { tenantId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const queryParams = new URLSearchParams(params).toString();
    return apiClient.get(`/transactions/stats?${queryParams}`, {
      requireAuth: true,
    });
  },

  getSubscription: (tenantId: string): Promise<SubscriptionInfo> =>
    apiClient.get(`/transactions/subscription?tenantId=${tenantId}`, {
      requireAuth: true,
    }),

  reprintTransaction: (tenantId: string, transactionId: string): Promise<{ success: boolean; printCount: number }> =>
    apiClient.post(`/transactions/${transactionId}/reprint?tenantId=${tenantId}`, {}, {
      requireAuth: true,
    }),
};
