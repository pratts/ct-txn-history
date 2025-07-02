import { EtherscanProvider } from '../../src/data-providers/etherscan/etherscan';
import { TransactionRowDto } from '../../src/models/txn_csv_row.dto';

// Mock axios to avoid real API calls
jest.mock('axios');

describe('EtherscanProvider', () => {
    let provider: EtherscanProvider;

    beforeEach(() => {
        provider = new EtherscanProvider('test-api-key', 'https://api.etherscan.io');
    });

    describe('toEth', () => {
        test('should convert wei to ETH correctly', () => {
            // Access private method correctly
            const toEth = (provider as any).toEth.bind(provider);

            expect(toEth(BigInt('1000000000000000000'))).toBe('1'); // 1 ETH
            expect(toEth(BigInt('500000000000000000'))).toBe('0.5'); // 0.5 ETH
            expect(toEth(BigInt('0'))).toBe('0'); // 0 ETH
            expect(toEth(BigInt('1000000000000000'))).toBe('0.001'); // 0.001 ETH
        });
    });

    describe('toValueAmount', () => {
        test('should handle different token decimals', () => {
            const toValueAmount = (provider as any).toValueAmount.bind(provider);

            // Test USDC (6 decimals)
            const usdcTx = { value: '1000000', tokenDecimal: '6' };
            expect(toValueAmount(usdcTx)).toBe('1');

            // Test standard ERC-20 (18 decimals)
            const standardTx = { value: '1000000000000000000', tokenDecimal: '18' };
            expect(toValueAmount(standardTx)).toBe('1');

            // Test missing decimal (defaults to 18)
            const noDecimalTx = { value: '1000000000000000000' };
            expect(toValueAmount(noDecimalTx)).toBe('1');

            // Test WBTC (8 decimals)
            const wbtcTx = { value: '100000000', tokenDecimal: '8' };
            expect(toValueAmount(wbtcTx)).toBe('1');
        });

        test('should handle empty or zero values', () => {
            const toValueAmount = (provider as any).toValueAmount.bind(provider);

            const emptyTx = { value: '', tokenDecimal: '18' };
            expect(toValueAmount(emptyTx)).toBe('');

            const zeroTx = { value: '0', tokenDecimal: '18' };
            expect(toValueAmount(zeroTx)).toBe('0');
        });
    });

    describe('calcGasFee', () => {
        test('should calculate gas fee correctly', () => {
            const calcGasFee = (provider as any).calcGasFee.bind(provider);

            const tx = {
                gasUsed: '21000',
                gasPrice: '20000000000' // 20 Gwei
            };

            // 21000 * 20000000000 = 420000000000000 wei = 0.00042 ETH
            expect(calcGasFee(tx)).toBe('0.00042');
        });

        test('should return 0 for internal transactions', () => {
            const calcGasFee = (provider as any).calcGasFee.bind(provider);

            const tx = { gasUsed: '21000', gasPrice: '20000000000' };
            expect(calcGasFee(tx, true)).toBe('0');
        });

        test('should handle missing gas data', () => {
            const calcGasFee = (provider as any).calcGasFee.bind(provider);

            expect(calcGasFee({})).toBe('0');
            expect(calcGasFee({ gasUsed: '21000' })).toBe('0');
            expect(calcGasFee({ gasPrice: '20000000000' })).toBe('0');
        });

        test('should handle string and number inputs', () => {
            const calcGasFee = (provider as any).calcGasFee.bind(provider);

            const tx1 = { gasUsed: 21000, gasPrice: 20000000000 };
            const tx2 = { gasUsed: '21000', gasPrice: '20000000000' };

            expect(calcGasFee(tx1)).toBe('0.00042');
            expect(calcGasFee(tx2)).toBe('0.00042');
        });
    });

    describe('deduplicateTransactions', () => {
        test('should remove duplicate transactions', () => {
            const deduplicateTransactions = (provider as any).deduplicateTransactions.bind(provider);

            const tx1 = new TransactionRowDto();
            tx1.transactionHash = '0x123';
            tx1.fromAddress = '0xabc';
            tx1.toAddress = '0xdef';
            tx1.assetContractAddress = '';

            const tx2 = new TransactionRowDto();
            tx2.transactionHash = '0x123'; // Same hash
            tx2.fromAddress = '0xabc';
            tx2.toAddress = '0xdef';
            tx2.assetContractAddress = '';

            const tx3 = new TransactionRowDto();
            tx3.transactionHash = '0x456'; // Different hash
            tx3.fromAddress = '0xabc';
            tx3.toAddress = '0xdef';
            tx3.assetContractAddress = '';

            const result = deduplicateTransactions([tx1, tx2, tx3]);
            expect(result).toHaveLength(2);
            expect(result[0].transactionHash).toBe('0x123');
            expect(result[1].transactionHash).toBe('0x456');
        });

        test('should handle empty array', () => {
            const deduplicateTransactions = (provider as any).deduplicateTransactions.bind(provider);

            const result = deduplicateTransactions([]);
            expect(result).toHaveLength(0);
        });

        test('should keep transactions with different contract addresses', () => {
            const deduplicateTransactions = (provider as any).deduplicateTransactions.bind(provider);

            const tx1 = new TransactionRowDto();
            tx1.transactionHash = '0x123';
            tx1.fromAddress = '0xabc';
            tx1.toAddress = '0xdef';
            tx1.assetContractAddress = '0xcontract1';

            const tx2 = new TransactionRowDto();
            tx2.transactionHash = '0x123'; // Same hash
            tx2.fromAddress = '0xabc';
            tx2.toAddress = '0xdef';
            tx2.assetContractAddress = '0xcontract2'; // Different contract

            const result = deduplicateTransactions([tx1, tx2]);
            expect(result).toHaveLength(2); // Should keep both as different contracts
        });
    });
});