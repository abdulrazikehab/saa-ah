import { apiClient } from './core/api-client';

// Wallet Types
export interface Wallet {
  id: string;
  tenantId: string;
  userId: string;
  balance: string | number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  transactions?: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'TOPUP' | 'PURCHASE' | 'REFUND' | 'BONUS' | 'ADJUSTMENT' | 'WITHDRAWAL';
  amount: string | number;
  balanceBefore: string | number;
  balanceAfter: string | number;
  currency: string;
  description: string;
  descriptionAr?: string;
  reference?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  orderId?: string | null;
  topUpRequestId?: string | null;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  data: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Bank {
  id: string;
  tenantId: string;
  name: string;
  nameAr?: string;
  code: string;
  logo?: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankDto {
  name: string;
  nameAr?: string;
  code: string;
  logo?: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TopUpRequest {
  id: string;
  tenantId: string;
  userId: string;
  amount: string | number;
  currency: string;
  paymentMethod: 'BANK_TRANSFER' | 'VISA' | 'MASTERCARD' | 'MADA' | 'APPLE_PAY' | 'STC_PAY';
  bankId?: string | null;
  senderAccountId?: string | null;
  senderName?: string | null;
  transferReference?: string | null;
  receiptImage?: string | null;
  notes?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  processedAt?: string | null;
  processedByUserId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  bank?: Bank | null;
  senderAccount?: BankAccount | null;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTopUpRequestDto {
  amount: number;
  currency?: string;
  paymentMethod: 'BANK_TRANSFER' | 'VISA' | 'MASTERCARD' | 'MADA' | 'APPLE_PAY' | 'STC_PAY';
  bankId?: string;
  senderAccountId?: string;
  senderName?: string;
  transferReference?: string;
  receiptImage?: string;
  notes?: string;
}

export interface AddBankAccountDto {
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  isDefault?: boolean;
}

export interface ApproveTopUpResponse {
  id: string;
  status: 'APPROVED';
  processedAt: string;
  processedByUserId: string;
  wallet: {
    id: string;
    balance: string | number;
  };
  transaction: {
    id: string;
    type: 'TOPUP';
    amount: string | number;
    balanceAfter: string | number;
  };
}

export interface RejectTopUpResponse {
  id: string;
  status: 'REJECTED';
  processedAt: string;
  processedByUserId: string;
  rejectionReason: string;
}

export const walletService = {
  /**
   * Get wallet balance
   * GET /api/merchant/wallet/balance
   */
  getBalance: (): Promise<Wallet> =>
    apiClient.get('/merchant/wallet/balance', {
      requireAuth: true,
    }),

  /**
   * Get wallet transactions with pagination
   * GET /api/merchant/wallet/transactions?page=1&limit=20
   */
  getTransactions: (page: number = 1, limit: number = 20): Promise<WalletTransactionsResponse> =>
    apiClient.get(`/merchant/wallet/transactions?page=${page}&limit=${limit}`, {
      requireAuth: true,
    }),

  /**
   * Get available banks for top-ups (active only)
   * GET /api/merchant/wallet/banks
   */
  getBanks: (): Promise<Bank[]> =>
    apiClient.get('/merchant/wallet/banks', {
      requireAuth: true,
    }),

  /**
   * Get all banks for merchant management (including inactive)
   * GET /api/merchant/wallet/banks/all
   */
  getAllBanks: (): Promise<Bank[]> =>
    apiClient.get('/merchant/wallet/banks/all', {
      requireAuth: true,
    }),

  /**
   * Create a new merchant bank
   * POST /api/merchant/wallet/banks
   */
  createBank: (data: CreateBankDto, logoFile?: File): Promise<Bank> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    return apiClient.post('/merchant/wallet/banks', formData, {
      requireAuth: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Update a merchant bank
   * POST /api/merchant/wallet/banks/:id
   */
  updateBank: (id: string, data: Partial<CreateBankDto>, logoFile?: File): Promise<Bank> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    return apiClient.post(`/merchant/wallet/banks/${id}`, formData, {
      requireAuth: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Delete a merchant bank
   * POST /api/merchant/wallet/banks/:id/delete
   */
  deleteBank: (id: string): Promise<void> =>
    apiClient.post(`/merchant/wallet/banks/${id}/delete`, {}, {
      requireAuth: true,
    }),

  /**
   * Get user's bank accounts
   * GET /api/merchant/wallet/bank-accounts
   */
  getBankAccounts: (): Promise<BankAccount[]> =>
    apiClient.get('/merchant/wallet/bank-accounts', {
      requireAuth: true,
    }),

  /**
   * Add a new bank account
   * POST /api/merchant/wallet/bank-accounts
   */
  addBankAccount: (data: AddBankAccountDto): Promise<BankAccount> =>
    apiClient.post('/merchant/wallet/bank-accounts', data, {
      requireAuth: true,
    }),

  /**
   * Create a new top-up request
   * POST /api/merchant/wallet/topup
   */
  createTopUpRequest: (data: CreateTopUpRequestDto): Promise<TopUpRequest> =>
    apiClient.post('/merchant/wallet/topup', data, {
      requireAuth: true,
    }),

  /**
   * Get top-up requests for the authenticated user
   * GET /api/merchant/wallet/topup-requests?status=PENDING
   */
  getTopUpRequests: (status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'): Promise<TopUpRequest[]> => {
    const url = status 
      ? `/merchant/wallet/topup-requests?status=${status}`
      : '/merchant/wallet/topup-requests';
    return apiClient.get(url, {
      requireAuth: true,
    });
  },

  /**
   * Get pending top-up requests (Admin only)
   * GET /api/merchant/wallet/admin/pending-topups
   */
  getPendingTopUps: (): Promise<TopUpRequest[]> =>
    apiClient.get('/merchant/wallet/admin/pending-topups', {
      requireAuth: true,
    }),

  /**
   * Approve a top-up request (Admin only)
   * POST /api/merchant/wallet/admin/topup/:id/approve
   */
  approveTopUp: (id: string): Promise<ApproveTopUpResponse> =>
    apiClient.post(`/merchant/wallet/admin/topup/${id}/approve`, {}, {
      requireAuth: true,
    }),

  /**
   * Reject a top-up request (Admin only)
   * POST /api/merchant/wallet/admin/topup/:id/reject
   */
  rejectTopUp: (id: string, reason: string): Promise<RejectTopUpResponse> =>
    apiClient.post(`/merchant/wallet/admin/topup/${id}/reject`, { reason }, {
      requireAuth: true,
    }),
};

