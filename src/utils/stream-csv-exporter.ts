import * as fs from 'fs';
import * as path from 'path';
import { Transform, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { TransactionRowDto } from '../models/txn_csv_row.dto';

export class StreamingCSVExporter {
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

        const str = String(field);

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
     * Transform stream that converts TransactionRowDto to CSV strings
     */
    private createCSVTransform(): Transform {
        let isFirstRow = true;

        const transform = (transaction: TransactionRowDto, encoding, callback) => {
            try {
                let output = '';

                // Add header for first row
                if (isFirstRow) {
                    output += this.CSV_HEADERS.join(',') + '\n';
                    isFirstRow = false;
                }

                // Add transaction row
                output += this.transactionToCSVRow(transaction) + '\n';

                callback(null, output);
            } catch (error) {
                callback(error);
            }
        }
        return new Transform({
            objectMode: true,
            transform
        });
    }

    /**
     * Streams transactions to CSV file
     */
    async exportToCSVStream(
        transactionStream: Readable,
        filename: string,
        onProgress?: (count: number) => void
    ): Promise<void> {
        try {
            // Create output directory
            const outputDir = path.join(process.cwd(), 'output');
            await fs.promises.mkdir(outputDir, { recursive: true });

            const filePath = path.join(outputDir, filename);

            // Create streams
            const csvTransform = this.createCSVTransform();
            const writeStream = fs.createWriteStream(filePath, { encoding: 'utf8' });

            // Add progress tracking
            let transactionCount = 0;
            const progressTransform = new Transform({
                objectMode: true,
                transform(transaction: TransactionRowDto, encoding, callback) {
                    transactionCount++;
                    if (onProgress && transactionCount % 100 === 0) {
                        onProgress(transactionCount);
                    }
                    callback(null, transaction);
                }
            });

            // Create pipeline
            await pipeline(
                transactionStream,
                progressTransform,
                csvTransform,
                writeStream
            );

            console.log(`✅ Successfully streamed ${transactionCount} transactions to ${filePath}`);

        } catch (error) {
            console.error('❌ Error streaming CSV:', error);
            throw error;
        }
    }

    /**
     * Creates a readable stream from an array of transactions
     */
    createTransactionStream(transactions: TransactionRowDto[]): Readable {
        let index = 0;

        return new Readable({
            objectMode: true,
            read() {
                if (index < transactions.length) {
                    this.push(transactions[index++]);
                } else {
                    this.push(null); // End of stream
                }
            }
        });
    }

    /**
     * Helper method to export array of transactions using streaming
     */
    async exportArrayToCSVStream(
        transactions: TransactionRowDto[],
        filename: string,
        onProgress?: (count: number) => void
    ): Promise<void> {
        const transactionStream = this.createTransactionStream(transactions);
        await this.exportToCSVStream(transactionStream, filename, onProgress);
    }
}