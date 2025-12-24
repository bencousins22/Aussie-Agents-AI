import { financialService, FinancialData } from './financials';

describe('FinancialService', () => {
  it('should return financial data', async () => {
    const data: FinancialData = await financialService.getFinancialData();
    expect(data).toBeDefined();
    expect(data.outstandingInvoices).toBeDefined();
    expect(data.revenue).toBeDefined();
    expect(data.profitMargin).toBeDefined();
  });

  it('should return data with the correct shape', async () => {
    const data: FinancialData = await financialService.getFinancialData();
    expect(typeof data.outstandingInvoices.total).toBe('number');
    expect(typeof data.outstandingInvoices.overdue).toBe('number');
    expect(typeof data.revenue.thisMonth).toBe('number');
    expect(typeof data.revenue.lastMonth).toBe('number');
    expect(typeof data.profitMargin.current).toBe('number');
    expect(typeof data.profitMargin.target).toBe('number');
  });
});
