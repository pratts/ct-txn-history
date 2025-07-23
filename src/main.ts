import { DataProviderFactory } from './data-providers/provider';
import { ConfigDto, loadConfig } from './models/config.dto';
import { CSVExporter } from './utils/csv-exporter';
import { isAddress } from 'ethers';

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

        // For a given configuration, get the appropriate data provider
        console.log(`\n🔗 Fetching transactions for address: ${address}`);
        const dataProvider = DataProviderFactory.getProvider(config);
        if (!dataProvider) {
            console.error('❌ No valid data provider found. Please check your configuration.');
            process.exit(1);
        }

        const transactions = await dataProvider.fetchEthTransactions(address, fromDate, toDate);
        console.log(`📊 Found ${transactions.length} transactions for address: ${address}`);

        if (transactions.length === 0) {
            console.log('✅ No transactions found for the specified address and date range.');
            process.exit(0);
        }

        console.log('\n📥 Exporting transactions to CSV...');
        const csvExporter = new CSVExporter();
        await csvExporter.exportToCSVWithValidation(transactions, `${address}_transactions.csv`)
        console.log(`✅ Successfully exported ${transactions.length} transactions to ${address}_transactions.csv`);
    } catch (error) {
        console.error('Error processing address transactions:', error);
        process.exit(1);
    }
})();
