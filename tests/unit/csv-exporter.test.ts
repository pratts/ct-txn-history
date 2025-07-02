import { CSVExporter } from '../../src/utils/csv-exporter';
import { TransactionRowDto } from '../../src/models/txn_csv_row.dto';
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

        // Setup default mock implementations
        mockMkdir.mockResolvedValue(undefined);
        mockWriteFile.mockResolvedValue(undefined);
    });

    describe('escapeCSVField', () => {
        test('should escape fields with commas', () => {
            const escapeCSVField = (exporter as any).escapeCSVField.bind(exporter);

            expect(escapeCSVField('hello,world')).toBe('"hello,world"');
            expect(escapeCSVField('simple')).toBe('simple');
            expect(escapeCSVField('text with "quotes"')).toBe('"text with ""quotes"""');
            expect(escapeCSVField('')).toBe('');
            expect(escapeCSVField('text\nwith\nnewlines')).toBe('"text\nwith\nnewlines"');
        });

        test('should handle null and undefined values', () => {
            const escapeCSVField = (exporter as any).escapeCSVField.bind(exporter);

            expect(escapeCSVField(null)).toBe('');
            expect(escapeCSVField(undefined)).toBe('');
        });
    });

    describe('transactionToCSVRow', () => {
        test('should convert transaction to CSV row correctly', () => {
            const transactionToCSVRow = (exporter as any).transactionToCSVRow.bind(exporter);

            const transaction = new TransactionRowDto();
            transaction.transactionHash = '0x123';
            transaction.dateTime = '2023-01-01T00:00:00.000Z';
            transaction.fromAddress = '0xabc';
            transaction.toAddress = '0xdef';
            transaction.transactionType = 'ETH transfer';
            transaction.assetContractAddress = '';
            transaction.assetSymbol = 'ETH';
            transaction.tokenId = '';
            transaction.valueAmount = '1.0';
            transaction.gasFeeEth = '0.001';

            const result = transactionToCSVRow(transaction);
            const expected = '0x123,2023-01-01T00:00:00.000Z,0xabc,0xdef,ETH transfer,,ETH,,1.0,0.001';

            expect(result).toBe(expected);
        });

        test('should handle fields with commas', () => {
            const transactionToCSVRow = (exporter as any).transactionToCSVRow.bind(exporter);

            const transaction = new TransactionRowDto();
            transaction.transactionHash = '0x123';
            transaction.dateTime = '2023-01-01T00:00:00.000Z';
            transaction.fromAddress = '0xabc';
            transaction.toAddress = '0xdef';
            transaction.transactionType = 'ETH transfer';
            transaction.assetContractAddress = '';
            transaction.assetSymbol = 'Token, Inc'; // Contains comma
            transaction.tokenId = '';
            transaction.valueAmount = '1.0';
            transaction.gasFeeEth = '0.001';

            const result = transactionToCSVRow(transaction);
            expect(result).toContain('"Token, Inc"');
        });
    });

    describe('exportToCSV', () => {
        test('should create output directory and write CSV file', async () => {
            const transaction = createValidTransaction();

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

            // Check that CSV content includes the transaction data
            const writtenContent = mockWriteFile.mock.calls[0][1] as string;
            expect(writtenContent).toContain('0x123');
            expect(writtenContent).toContain('ETH transfer');
        });

        test('should handle multiple transactions', async () => {
            const transactions = [
                createValidTransaction('0x123'),
                createValidTransaction('0x456'),
                createValidTransaction('0x789')
            ];

            await exporter.exportToCSV(transactions, 'multiple.csv');

            const writtenContent = mockWriteFile.mock.calls[0][1] as string;
            const lines = writtenContent.split('\n');

            // Should have header + 3 transactions (no empty line at end)
            expect(lines.length).toBe(4);
            expect(lines[0]).toContain('Transaction Hash');
            expect(lines[1]).toContain('0x123');
            expect(lines[2]).toContain('0x456');
            expect(lines[3]).toContain('0x789');
        });

        test('should handle write errors', async () => {
            mockWriteFile.mockRejectedValue(new Error('Write failed'));

            await expect(
                exporter.exportToCSV([], 'test.csv')
            ).rejects.toThrow('Write failed');
        });

        test('should handle mkdir errors', async () => {
            mockMkdir.mockRejectedValue(new Error('Permission denied'));

            await expect(
                exporter.exportToCSV([], 'test.csv')
            ).rejects.toThrow('Permission denied');
        });
    });

    describe('validateTransaction', () => {
        test('should validate required fields', () => {
            const validateTransaction = (exporter as any).validateTransaction.bind(exporter);

            const validTx = createValidTransaction();
            expect(validateTransaction(validTx)).toBe(true);
        });

        test('should reject transactions with missing required fields', () => {
            const validateTransaction = (exporter as any).validateTransaction.bind(exporter);

            const invalidTx = new TransactionRowDto();
            invalidTx.transactionHash = '0x123';
            // Missing other required fields

            expect(validateTransaction(invalidTx)).toBe(false);
        });

        test('should check all required fields', () => {
            const validateTransaction = (exporter as any).validateTransaction.bind(exporter);

            const requiredFields = ['transactionHash', 'dateTime', 'fromAddress', 'toAddress', 'transactionType'];

            for (const missingField of requiredFields) {
                const tx = createValidTransaction();
                (tx as any)[missingField] = ''; // Set field to empty

                expect(validateTransaction(tx)).toBe(false);
            }
        });
    });

    describe('exportToCSVWithValidation', () => {
        test('should filter out invalid transactions', async () => {
            const validTx = createValidTransaction('0x123');
            const invalidTx = new TransactionRowDto();
            invalidTx.transactionHash = '0x456';
            // Missing other required fields

            await exporter.exportToCSVWithValidation([validTx, invalidTx], 'filtered.csv');

            const writtenContent = mockWriteFile.mock.calls[0][1] as string;
            expect(writtenContent).toContain('0x123');
            expect(writtenContent).not.toContain('0x456');
        });
    });
});

// Helper function to create valid transactions
function createValidTransaction(hash: string = '0x123'): TransactionRowDto {
    const transaction = new TransactionRowDto();
    transaction.transactionHash = hash;
    transaction.dateTime = '2023-01-01T00:00:00.000Z';
    transaction.fromAddress = '0xabc';
    transaction.toAddress = '0xdef';
    transaction.transactionType = 'ETH transfer';
    transaction.assetContractAddress = '';
    transaction.assetSymbol = 'ETH';
    transaction.tokenId = '';
    transaction.valueAmount = '1.0';
    transaction.gasFeeEth = '0.001';
    return transaction;
}