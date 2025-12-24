export interface RevenueData {
  month: string;
  revenue: number;
}

export interface Invoice {
  id: string;
  customer: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface FinancialData {
  revenueAnalysis: {
    monthlyTrend: RevenueData[];
    ytdRevenue: number;
  };
  invoiceDetails: {
    outstanding: number;
    overdue: number;
    agingBrackets: {
      '1-30': number;
      '31-60': number;
      '61-90': number;
      '90+': number;
    };
    recentInvoices: Invoice[];
  };
  profitMargin: {
    current: number;
    target: number;
    trend: 'up' | 'down' | 'flat';
  };
}

class FinancialService {
  private mockData: FinancialData = {
    revenueAnalysis: {
      monthlyTrend: [
        { month: 'Jan', revenue: 18000 },
        { month: 'Feb', revenue: 22000 },
        { month: 'Mar', revenue: 25000 },
        { month: 'Apr', revenue: 23000 },
        { month: 'May', revenue: 28000 },
        { month: 'Jun', revenue: 31000 },
      ],
      ytdRevenue: 147000,
    },
    invoiceDetails: {
      outstanding: 32500.50,
      overdue: 12800.00,
      agingBrackets: {
        '1-30': 6500.00,
        '31-60': 3200.00,
        '61-90': 1100.00,
        '90+': 2000.00,
      },
      recentInvoices: [
        { id: 'INV-001', customer: 'Innovate Corp', amount: 5000, dueDate: '2024-07-25', status: 'Pending' },
        { id: 'INV-002', customer: 'Solutions Inc.', amount: 7500, dueDate: '2024-07-20', status: 'Paid' },
        { id: 'INV-003', customer: 'Alpha Industries', amount: 3200, dueDate: '2024-06-15', status: 'Overdue' },
        { id: 'INV-004', customer: 'Market Leaders', amount: 1100, dueDate: '2024-05-10', status: 'Overdue' },
        { id: 'INV-005', customer: 'Tech Giants', amount: 8800, dueDate: '2024-07-30', status: 'Pending' },
        { id: 'INV-006', customer: 'Synergy Group', amount: 2000, dueDate: '2024-03-01', status: 'Overdue' },
      ],
    },
    profitMargin: {
      current: 0.28,
      target: 0.30,
      trend: 'up',
    },
  };

  public getFinancialData(): Promise<FinancialData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.mockData);
      }, 500);
    });
  }
}

export const financialService = new FinancialService();
