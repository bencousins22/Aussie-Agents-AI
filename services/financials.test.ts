import { financialService, FinancialData } from './financials';

describe('FinancialService', () => {
  let data: FinancialData;

  beforeAll(async () => {
    data = await financialService.getFinancialData();
  });

  it('should return a defined financial data object', () => {
    expect(data).toBeDefined();
  });

  describe('Revenue Analysis', () => {
    it('should have a defined revenueAnalysis property', () => {
      expect(data.revenueAnalysis).toBeDefined();
    });

    it('should have a YTD revenue as a number', () => {
      expect(typeof data.revenueAnalysis.ytdRevenue).toBe('number');
    });

    it('should have a monthly trend array', () => {
      expect(Array.isArray(data.revenueAnalysis.monthlyTrend)).toBe(true);
      expect(data.revenueAnalysis.monthlyTrend.length).toBeGreaterThan(0);
    });

    it('should have the correct shape for monthly trend items', () => {
      const trendItem = data.revenueAnalysis.monthlyTrend[0];
      expect(typeof trendItem.month).toBe('string');
      expect(typeof trendItem.revenue).toBe('number');
    });
  });

  describe('Invoice Details', () => {
    it('should have a defined invoiceDetails property', () => {
      expect(data.invoiceDetails).toBeDefined();
    });

    it('should have numeric values for outstanding and overdue amounts', () => {
      expect(typeof data.invoiceDetails.outstanding).toBe('number');
      expect(typeof data.invoiceDetails.overdue).toBe('number');
    });

    it('should have defined aging brackets', () => {
      expect(data.invoiceDetails.agingBrackets).toBeDefined();
      expect(typeof data.invoiceDetails.agingBrackets['1-30']).toBe('number');
    });

    it('should have a recent invoices array', () => {
      expect(Array.isArray(data.invoiceDetails.recentInvoices)).toBe(true);
      expect(data.invoiceDetails.recentInvoices.length).toBeGreaterThan(0);
    });

    it('should have the correct shape for recent invoice items', () => {
      const invoiceItem = data.invoiceDetails.recentInvoices[0];
      expect(typeof invoiceItem.id).toBe('string');
      expect(typeof invoiceItem.customer).toBe('string');
      expect(typeof invoiceItem.amount).toBe('number');
      expect(typeof invoiceItem.dueDate).toBe('string');
      expect(['Paid', 'Pending', 'Overdue']).toContain(invoiceItem.status);
    });
  });

  describe('Profit Margin', () => {
    it('should have a defined profitMargin property', () => {
      expect(data.profitMargin).toBeDefined();
    });

    it('should have numeric values for current and target profit margins', () => {
      expect(typeof data.profitMargin.current).toBe('number');
      expect(typeof data.profitMargin.target).toBe('number');
    });

    it('should have a valid trend value', () => {
      expect(['up', 'down', 'flat']).toContain(data.profitMargin.trend);
    });
  });
});
