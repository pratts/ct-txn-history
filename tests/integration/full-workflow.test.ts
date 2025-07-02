import { EtherscanProvider } from '../../data-providers/etherscan/etherscan';
import { CSVExporter } from '../../utils/csv-exporter';

describe('Full Workflow Integration', () => {
    // These tests require a real API key and should be run sparingly
    const API_KEY = process.env.ETHERSCAN_API_KEY || 'test-key';

    beforeEach(() => {
        if (!process.env.ETHERSCAN_API_KEY) {
            console.warn('Skipping integration tests - no API key provided');
        }
    });

    test('should fetch and export real transactions', async () => {
        if (!process.env.ETHERSCAN_API_KEY) {
            return; // Skip if no API key
        }

        const provider = new EtherscanProvider(API_KEY, 'https://api.etherscan.io');

        // Use a known address with few transactions for testing
        const testAddress = '0xa39b189482f984388a34460636fea9eb181ad1a6';
        const startDate = new Date('2023-01-01');
        const endDate = new Date('2023-01-31');

        const transactions = await provider.fetchEthTransactions(
            testAddress,
            startDate,
            endDate
        );

        expect(Array.isArray(transactions)).toBe(true);

        if (transactions.length > 0) {
            expect(transactions[0]).toHaveProperty('transactionHash');
            expect(transactions[0]).toHaveProperty('dateTime');
            expect(transactions[0]).toHaveProperty('fromAddress');
        }

        // Test CSV export
        const exporter = new CSVExporter();
        await expect(
            exporter.exportToCSV(transactions, `test-${Date.now()}.csv`)
        ).resolves.not.toThrow();
    }, 30000); // 30 second timeout for API calls
});