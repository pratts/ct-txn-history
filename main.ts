import { ConfigDto, loadConfig } from './models/config.dto';

// Accepting the input parameters from the command line
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node main.js <address> <fromDate>');
    process.exit(1);
}

const address = args[0];
const fromDate = args[1];
const toDate = args[2];

console.log('Address:', address);
console.log('From Date:', fromDate);
console.log('To Date:', toDate || 'Not provided, using current date');
// Loading configuration and validating it
const config: ConfigDto = loadConfig();
config.validate();
console.log('Configuration loaded and validated:', config);
//