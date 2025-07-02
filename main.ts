import { DataProviderFactory } from './data-providers/provider';
import { ConfigDto, loadConfig } from './models/config.dto';

// Accepting the input parameters from the command line
const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: node main.js <address> <fromDate>');
    process.exit(1);
}

const address = args[0];
let fromDate: Date = null;
let toDate: Date = null;

if (args[1]) {
    fromDate = new Date(args[1]);
    if (isNaN(fromDate.getTime())) {
        console.error('Invalid fromDate format. Please use a valid date format.');
        process.exit(1);
    }
}

if (args[2]) {
    toDate = new Date(args[2]);

    if (isNaN(toDate.getTime())) {
        console.error('Invalid toDate format. Please use a valid date format.');
        process.exit(1);
    }

    if (toDate.getTime() < (fromDate ? fromDate.getTime() : 0)) {
        console.error('toDate cannot be earlier than fromDate.');
        process.exit(1);
    }
}

(async () => {
    // Loading configuration and validating it
    const config: ConfigDto = loadConfig();
    config.validate();
    console.log('Configuration loaded and validated:', config);

    // For a given configuration, get the appropriate data provider
    const dataProvider = DataProviderFactory.getProvider(config);
    if (!dataProvider) {
        console.error('No valid data provider found. Please check your configuration.');
        process.exit(1);
    }

    const transactions = await dataProvider.fetchEthTransactions(address, fromDate, toDate);
})();
