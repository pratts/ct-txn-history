import { DataProvider } from "../provider";
import { Axios } from 'axios';
import { EtherScanBaseTransactionDto, EtherScanBlockNumDto, EtherScanERC20TransferDto, EtherScanERC721TransferDto, EtherScanInternalTransactionDto, EtherScanNormalTransactionDto, EtherScanResponseDto } from "./etherscan.dto";
import { TransactionRowDto } from "../../models/txn_csv_row.dto";

export class EtherscanProvider implements DataProvider {
    private apiKey: string;
    private apiUrl: string;
    private axiosInstance: Axios;
    private readonly OFFSET = 100;

    constructor(apiKey: string, apiUrl: string) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.axiosInstance = new Axios({
            baseURL: this.apiUrl,
            params: {
                apikey: this.apiKey
            }
        })
    }

    private toEth(wei: BigInt) {
        return (Number(wei) / 1e18).toString();
    }

    private calcGasFee(tx: EtherScanBaseTransactionDto, isInternal: boolean = false): string {
        if (isInternal) {
            // Internal transactions don't have their own gas fees
            return '0';
        }

        if (!tx.gasUsed || !tx.gasPrice) return '0';
        return this.toEth(BigInt(tx.gasUsed) * BigInt(tx.gasPrice));
    }

    private toValueAmount(tx: EtherScanERC20TransferDto | EtherScanERC721TransferDto): string {
        if (!tx.value) return '';
        const decimals = tx.tokenDecimal ? parseInt(tx.tokenDecimal) : 18;
        return (Number(BigInt(tx.value)) / Math.pow(10, decimals)).toString();
    }

    public async getBlockNumberByTimestamp(date: Date, closest: string): Promise<string> {
        const blockByTimestamp = await this.axiosInstance.get('/v2/api', {
            params: {
                chainid: 1,
                module: 'block',
                action: 'getblocknobytime',
                timestamp: Math.floor(new Date(date).getTime() / 1000), // Convert date to Unix timestamp
                closest
            }
        })
        if (blockByTimestamp.status !== 200 || !blockByTimestamp.data) {
            throw new Error(`Failed to fetch block number for date ${date}: ${blockByTimestamp.data.message}`);
        }
        const etherscanBlockDto: EtherScanBlockNumDto = JSON.parse(blockByTimestamp.data);
        return etherscanBlockDto.result;
    }

    private deduplicateTransactions(transactions: TransactionRowDto[]): TransactionRowDto[] {
        const seen = new Set<string>();
        return transactions.filter(tx => {
            const key = `${tx.transactionHash}-${tx.fromAddress}-${tx.toAddress}-${tx.assetContractAddress}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    public async fetchEthTransactions(address: string, startDate: Date, endDate: Date): Promise<TransactionRowDto[]> {
        let [startBlock, endBlock] = ['0', 'latest']
        if (startDate != null && endDate != null) {
            [startBlock, endBlock] = await Promise.all([
                this.getBlockNumberByTimestamp(startDate, 'after'),
                this.getBlockNumberByTimestamp(endDate, 'before')
            ])
        }

        // Fetch transactions in a paginated manner
        const [normalTransactions, internalTransactions, erc20Transfers, erc721Transfers] = await Promise.all([
            this.fetchNormalTransactions(address, startBlock, endBlock),
            this.fetchInternalTransactions(address, startBlock, endBlock),
            this.fetchERC20Transfers(address, startBlock, endBlock),
            this.fetchERC721Transfers(address, startBlock, endBlock)
        ]);

        console.log(`Fetched ${normalTransactions.length} normal transactions, ${internalTransactions.length} internal transactions, ${erc20Transfers.length} ERC-20 transfers, and ${erc721Transfers.length} ERC-721 transfers for address: ${address}`);
        const transactions: TransactionRowDto[] = [];
        normalTransactions.forEach((tx) => {
            const row = new TransactionRowDto();
            row.transactionHash = tx.hash;
            row.dateTime = new Date(Number(tx.timeStamp) * 1000).toISOString();
            row.fromAddress = tx.from;
            row.toAddress = tx.to;
            row.transactionType = 'ETH transfer';
            row.assetContractAddress = '';
            row.assetSymbol = 'ETH';
            row.tokenId = '';
            row.valueAmount = this.toEth(BigInt(tx.value));
            row.gasFeeEth = this.calcGasFee(tx);
            transactions.push(row);
        });
        internalTransactions.forEach((tx) => {
            const row = new TransactionRowDto();
            row.transactionHash = tx.hash;
            row.dateTime = new Date(Number(tx.timeStamp) * 1000).toISOString();
            row.fromAddress = tx.from;
            row.toAddress = tx.to;
            row.transactionType = 'Internal transaction';
            row.assetContractAddress = tx.contractAddress;
            row.assetSymbol = 'ETH';
            row.tokenId = '';
            row.valueAmount = this.toEth(BigInt(tx.value));
            row.gasFeeEth = this.calcGasFee(tx, true);
            transactions.push(row);
        });
        erc20Transfers.forEach((tx) => {
            const row = new TransactionRowDto();
            row.transactionHash = tx.hash;
            row.dateTime = new Date(Number(tx.timeStamp) * 1000).toISOString();
            row.fromAddress = tx.from;
            row.toAddress = tx.to;
            row.transactionType = 'ERC-20 transfer';
            row.assetContractAddress = tx.contractAddress;
            row.assetSymbol = tx.tokenSymbol;
            row.tokenId = '';
            row.valueAmount = this.toValueAmount(tx);
            row.gasFeeEth = this.calcGasFee(tx);
            transactions.push(row);
        });
        erc721Transfers.forEach((tx) => {
            const row = new TransactionRowDto();
            row.transactionHash = tx.hash;
            row.dateTime = new Date(Number(tx.timeStamp) * 1000).toISOString();
            row.fromAddress = tx.from;
            row.toAddress = tx.to;
            row.transactionType = 'ERC-721 transfer';
            row.assetContractAddress = tx.contractAddress;
            row.assetSymbol = tx.tokenName;
            row.tokenId = tx.tokenID;
            row.valueAmount = this.toValueAmount(tx); // For NFTs, the value is typically 1
            row.gasFeeEth = this.calcGasFee(tx);
            transactions.push(row);
        });
        return this.deduplicateTransactions(transactions);
    }

    private async paginatedFetch<T extends EtherScanBaseTransactionDto>(address: string, startBlock: string, endBlock: string, action: string): Promise<T[]> {
        let page = 1;
        let lastBlock = +startBlock;
        const results: T[] = [];
        const RATE_LIMIT_DELAY = 200;

        while (true) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
            const txns = await this.axiosInstance.get('/v2/api', {
                params: {
                    chainid: 1,
                    module: 'account',
                    action,
                    address,
                    startblock: +lastBlock - 1,
                    endblock: endBlock,
                    page,
                    offset: this.OFFSET,
                    sort: 'asc'
                }
            });
            if (txns.status !== 200 || !txns.data) {
                break; // No more transactions or an error occurred
            }
            const response = JSON.parse(txns.data) as EtherScanResponseDto<T>;
            if (response.status !== '1' || !response.result || response.result.length === 0) {
                break; // No more transactions or an error occurred
            }

            results.push(...response.result);
            lastBlock = +response.result[response.result.length - 1].blockNumber;

            if (response.result.length < this.OFFSET) {
                break;
            }
            page++;
        }
        return results;
    }

    /**
     * 
     * @param address 
     * @param startBlock 
     * @param endBlock 
     * @returns 
     */
    public async fetchNormalTransactions(address: string, startBlock: string, endBlock: string): Promise<EtherScanNormalTransactionDto[]> {
        // Fetch transactions in a paginated manner
        return await this.paginatedFetch<EtherScanNormalTransactionDto>(address, startBlock, endBlock, 'txlist');
    }

    /**
     * 
     * @param address
     * @param startBlock 
     * @param endBlock 
     * @returns 
     */
    public async fetchInternalTransactions(address: string, startBlock: string, endBlock: string): Promise<EtherScanInternalTransactionDto[]> {
        // Fetch internal transactions in a paginated manner
        return await this.paginatedFetch<EtherScanInternalTransactionDto>(address, startBlock, endBlock, 'txlistinternal');
    }

    /**
     * 
     * @param address 
     * @param startBlock 
     * @param endBlock 
     * @returns 
     */
    public async fetchERC20Transfers(address: string, startBlock: string, endBlock: string): Promise<EtherScanERC20TransferDto[]> {
        return await this.paginatedFetch(address, startBlock, endBlock, 'tokentx');
    }

    public async fetchERC721Transfers(address: string, startBlock: string, endBlock: string): Promise<EtherScanERC721TransferDto[]> {
        return await this.paginatedFetch(address, startBlock, endBlock, 'tokennfttx');
    }

    async *fetchEthTransactionsStream(
        address: string,
        startDate?: Date,
        endDate?: Date
    ): AsyncGenerator<TransactionRowDto, void, unknown> {
        let [startBlock, endBlock] = ['0', 'latest'];

        if (startDate && endDate) {
            [startBlock, endBlock] = await Promise.all([
                this.getBlockNumberByTimestamp(startDate, 'after'),
                this.getBlockNumberByTimestamp(endDate, 'before')
            ]);
        }

        console.log(`🔄 Starting streaming fetch for address: ${address}`);

        // Fetch each transaction type and yield results as they come
        const transactionTypes = [
            { method: 'fetchNormalTransactions', type: 'ETH transfer' },
            { method: 'fetchInternalTransactions', type: 'Internal transaction' },
            { method: 'fetchERC20Transfers', type: 'ERC-20 transfer' },
            { method: 'fetchERC721Transfers', type: 'ERC-721 transfer' }
        ];

        for (const txType of transactionTypes) {
            console.log(`📡 Fetching ${txType.type} transactions...`);

            // Use the existing paginated fetch but yield results as they're processed
            const transactions = await (this[txType.method as keyof this] as Function).call(this, address, startBlock, endBlock) as any[];

            for (const tx of transactions) {
                const row = this.transformToTransactionRow(tx, txType.type);
                yield row;
            }
        }
    }

    /**
     * Helper method to transform raw transaction to TransactionRowDto
     */
    private transformToTransactionRow(tx: any, transactionType: string): TransactionRowDto {
        const row = new TransactionRowDto();
        row.transactionHash = tx.hash;
        row.dateTime = new Date(Number(tx.timeStamp) * 1000).toISOString();
        row.fromAddress = tx.from;
        row.toAddress = tx.to;
        row.transactionType = transactionType;

        switch (transactionType) {
            case 'ETH transfer':
                row.assetContractAddress = '';
                row.assetSymbol = 'ETH';
                row.tokenId = '';
                row.valueAmount = this.toEth(BigInt(tx.value));
                row.gasFeeEth = this.calcGasFee(tx);
                break;

            case 'Internal transaction':
                row.assetContractAddress = tx.contractAddress;
                row.assetSymbol = 'ETH';
                row.tokenId = '';
                row.valueAmount = this.toEth(BigInt(tx.value));
                row.gasFeeEth = this.calcGasFee(tx, true);
                break;

            case 'ERC-20 transfer':
                row.assetContractAddress = tx.contractAddress;
                row.assetSymbol = tx.tokenSymbol;
                row.tokenId = '';
                row.valueAmount = this.toValueAmount(tx);
                row.gasFeeEth = this.calcGasFee(tx);
                break;

            case 'ERC-721 transfer':
                row.assetContractAddress = tx.contractAddress;
                row.assetSymbol = tx.tokenName;
                row.tokenId = tx.tokenID;
                row.valueAmount = this.toValueAmount(tx);
                row.gasFeeEth = this.calcGasFee(tx);
                break;
        }

        return row;
    }
}
