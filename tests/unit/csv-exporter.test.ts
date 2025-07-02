import { CSVExporter } from '../../utils/csv-exporter';
import { TransactionRowDto } from '../../models/txn_csv_row.dto';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs
jest.mock('fs', () => ({
    promises: {
        mkdir: jest.fn(),
        writeFile: jest.fn()
    }
}));

describe('CSVExporter', () => {
    let exporter: CSVExporter;
    let mockMkdir: jest.MockedFunction<typeof fs.promises.mkdir>;
    let mockWriteFile: jest.MockedFunction<typeof fs.promises.writeFile>;

    beforeEach(() => {
        exporter = new CSVExporter();
        mockMkdir = fs.promises.mkdir as jest.MockedFunction<typeof fs.promises.mkdir>;
        mockWriteFile = fs.promises.writeFile as jest.MockedFunction<typeof fs.promises.writeFile>;

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('escapeCSVField', () => {
        test('should escape fields with commas', () => {
            const escapeCSVField = (exporter as any).escapeCSVField;

            expect(escapeCSVField('hello,world')).toBe('"hello,world"');
            expect(escapeCSVField('simple')).toBe('simple');
            expect(escapeCSVField('text with "quotes"')).toBe('"text with ""quotes"""');
            expect(escapeCSVField('')).toBe('');
        });
    });

    describe('exportToCSV', () => {
        test('should create output directory and write CSV file', async () => {
            const transaction = new TransactionRowDto();
            transaction.transactionHash = '0x123';
            transaction.dateTime = '2023-01-01T00:00:00.000Z';
            transaction.fromAddress = '0xabc';
            transaction.toAddress = '0xdef';
            transaction.transactionType = 'ETH transfer';
            transaction.assetSymbol = 'ETH';
            transaction.valueAmount = '1.0';
            transaction.gasFeeEth = '0.001';

            await exporter.exportToCSV([transaction], 'test.csv');

            // Verify directory creation
            expect(mockMkdir).toHaveBeenCalledWith(
                path.join(process.cwd(), 'output'),
                { recursive: true }
            );

            // Verify file write
            expect(mockWriteFile).toHaveBeenCalledWith(
                path.join(process.cwd(), 'output', 'test.csv'),
                expect.stringContaining('Transaction Hash,Date & Time'),
                'utf8'
            );
        });

        test('should handle write errors', async () => {
            mockWriteFile.mockRejectedValue(new Error('Write failed'));

            await expect(
                exporter.exportToCSV([], 'test.csv')
            ).rejects.toThrow('Write failed');
        });
    });

    describe('validateTransaction', () => {
        test('should validate required fields', () => {
            const validateTransaction = (exporter as any).validateTransaction;

            const validTx = new TransactionRowDto();
            validTx.transactionHash = '0x123';
            validTx.dateTime = '2023-01-01T00:00:00.000Z';
            validTx.fromAddress = '0xabc';
            validTx.toAddress = '0xdef';
            validTx.transactionType = 'ETH transfer';

            expect(validateTransaction(validTx)).toBe(true);

            const invalidTx = new TransactionRowDto();
            invalidTx.transactionHash = '0x123';
            // Missing required fields

            expect(validateTransaction(invalidTx)).toBe(false);
        });
    });
});