import { DataProviderFactory } from './data-providers/provider';
import { ConfigDto, loadConfig } from './models/config.dto';
import { isAddress } from 'ethers';
import { StreamingCSVExporter } from './utils/stream-csv-exporter';
import { Readable } from 'stream';

console.log('CT Transaction History - CLI Tool');

function printUsage() {
    console.log('\n📋 Usage:');
    console.log('  npx ts-node main.ts <address>                    # Fetch all transactions');
    console.log('  npx ts-node main.ts <address> <fromDate> <toDate> # Fetch transactions in date range');
    console.log('\n📅 Date format examples:');
    console.log('  2023-01-01');
    console.log('\n🔗 Example:');
    console.log('  npx ts-node main.ts 0xa39b189482f984388a34460636fea9eb181ad1a6 2023-01-01 2023-12-31');
}

// Accepting the input parameters from the command line
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('❌ Error: Address is required');
    printUsage();
    process.exit(1);
}

const address = args[0];
if (!isAddress(address)) {
    console.error('❌ Error: Invalid Ethereum address format');
    printUsage();
    process.exit(1);
}

let fromDate: Date = null;
let toDate: Date = null;

// Validate that both dates are provided together
if ((args[1] && !args[2]) || (!args[1] && args[2])) {
    console.error('❌ Both fromDate and toDate must be provided together, or neither.');
    printUsage();
    process.exit(1);
} else if (args[1] && args[2]) {
    fromDate = new Date(args[1]);
    toDate = new Date(args[2]);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        console.error('❌ Invalid date format. Please provide valid dates.');
        printUsage();
        process.exit(1);
    }

    if (toDate.getTime() < (fromDate ? fromDate.getTime() : 0)) {
        console.error('❌ toDate cannot be earlier than fromDate.');
        printUsage();
        process.exit(1);
    }
    const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
        console.warn(`❌ Warning: Large date range (${Math.round(daysDiff)} days). Please provide a date withing 1 year.`);
        printUsage();
        process.exit(1);
    }
}

(async () => {
    // Loading configuration and validating it
    try {
        console.log('\n🔧 Loading configuration...');
        const config: ConfigDto = loadConfig();
        config.validate();
        console.log('✅ Configuration loaded successfully');

        console.log(`\n🔗 Fetching transactions for address: ${address} from ${fromDate ? fromDate.toISOString() : 'start'} to ${toDate ? toDate.toISOString() : 'now'}`);
        const provider = DataProviderFactory.getProvider(config);
        const exporter = new StreamingCSVExporter();

        console.log('🚀 Starting streaming export...');

        // Alternative: Convert async generator to readable stream
        const streamFromGenerator = async function* () {
            for await (const transaction of provider.fetchEthTransactionsStream(address, fromDate, toDate)) {
                yield transaction;
            }
        };

        // Convert generator to readable stream
        const readableStream = Readable.from(streamFromGenerator());

        // Export with progress tracking
        await exporter.exportToCSVStream(
            readableStream,
            `${address}_transactions_streamed.csv`,
            (count) => {
                if (count % 500 === 0) {
                    console.log(`📊 Processed ${count} transactions...`);
                }
            }
        );

        console.log('🎉 Streaming export completed!');
    } catch (error) {
        console.error('Error processing address transactions:', error.message);
        process.exit(1);
    }
})();
