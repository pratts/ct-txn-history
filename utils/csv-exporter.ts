import * as fs from 'fs';
import { TransactionRowDto } from '../models/txn_csv_row.dto';

export class CSVExporter {
    private readonly CSV_HEADERS = [
        'Transaction Hash',
        'Date & Time',
        'From Address',
        'To Address',
        'Transaction Type',
        'Asset Contract Address',
        'Asset Symbol/Name',
        'Token ID',
        'Value/Amount',
        'Gas Fee (ETH)'
    ];

    /**
     * Escapes CSV field values to handle commas, quotes, and newlines
     */
    private escapeCSVField(field: string): string {
        if (!field) return '';

        // Convert to string and handle potential undefined/null values
        const str = String(field);

        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }

        return str;
    }

    /**
     * Converts a transaction record to CSV row
     */
    private transactionToCSVRow(transaction: TransactionRowDto): string {
        const fields = [
            transaction.transactionHash,
            transaction.dateTime,
            transaction.fromAddress,
            transaction.toAddress,
            transaction.transactionType,
            transaction.assetContractAddress || '',
            transaction.assetSymbol,
            transaction.tokenId || '',
            transaction.valueAmount,
            transaction.gasFeeEth
        ];

        return fields.map(field => this.escapeCSVField(field)).join(',');
    }

    /**
     * Exports transactions to CSV file
     */
    async exportToCSV(transactions: TransactionRowDto[], filename: string): Promise<void> {
        try {
            // Create CSV content
            const csvLines: string[] = [];

            // Add header
            csvLines.push(this.CSV_HEADERS.join(','));

            // Add transaction rows
            transactions.forEach(transaction => {
                csvLines.push(this.transactionToCSVRow(transaction));
            });

            // Write to file
            const csvContent = csvLines.join('\n');
            await fs.promises.writeFile(filename, csvContent, 'utf8');

            console.log(`✅ Successfully exported ${transactions.length} transactions to ${filename}`);

        } catch (error) {
            console.error('❌ Error exporting CSV:', error);
            throw error;
        }
    }

    /**
     * Exports transactions to CSV with streaming (for large datasets)
     */
    async exportToCSVStream(transactions: TransactionRowDto[], filename: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filename, { encoding: 'utf8' });

            writeStream.on('error', reject);
            writeStream.on('finish', () => {
                console.log(`✅ Successfully streamed ${transactions.length} transactions to ${filename}`);
                resolve();
            });

            // Write header
            writeStream.write(this.CSV_HEADERS.join(',') + '\n');

            // Write transactions
            transactions.forEach(transaction => {
                writeStream.write(this.transactionToCSVRow(transaction) + '\n');
            });

            writeStream.end();
        });
    }

    /**
     * Validates transaction data before export
     */
    private validateTransaction(transaction: TransactionRowDto): boolean {
        const requiredFields = ['transactionHash', 'dateTime', 'fromAddress', 'toAddress', 'transactionType'];

        for (const field of requiredFields) {
            if (!transaction[field as keyof TransactionRowDto]) {
                console.warn(`⚠️  Transaction missing required field '${field}':`, transaction.transactionHash);
                return false;
            }
        }

        return true;
    }

    /**
     * Exports transactions with validation
     */
    async exportToCSVWithValidation(transactions: TransactionRowDto[], filename: string): Promise<void> {
        const validTransactions = transactions.filter(tx => this.validateTransaction(tx));

        if (validTransactions.length !== transactions.length) {
            console.warn(`⚠️  Filtered out ${transactions.length - validTransactions.length} invalid transactions`);
        }

        await this.exportToCSV(validTransactions, filename);
    }
}