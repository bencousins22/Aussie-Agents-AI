export interface FinancialData {
  outstandingInvoices: {
    total: number;
    overdue: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
  };
  profitMargin: {
    current: number;
    target: number;
  };
}

class FinancialService {
  private mockData: FinancialData = {
    outstandingInvoices: {
      total: 12500.50,
      overdue: 4800.00,
    },
    revenue: {
      thisMonth: 25000.00,
      lastMonth: 22000.00,
    },
    profitMargin: {
      current: 0.25,
      target: 0.30,
    },
  };

  public getFinancialData(): Promise<FinancialData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate some data fluctuation
        this.mockData.revenue.thisMonth += Math.random() * 1000 - 500;
        this.mockData.outstandingInvoices.total += Math.random() * 500 - 250;
        resolve(this.mockData);
      }, 500);
    });
  }
}

export const financialService = new FinancialService();
