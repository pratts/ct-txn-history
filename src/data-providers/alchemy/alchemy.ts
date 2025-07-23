import { Alchemy, AssetTransfersCategory, AssetTransfersParams, AssetTransfersResponse, AssetTransfersWithMetadataResult, BigNumber, Network, SortingOrder, TransactionReceipt, TransactionResponse } from "alchemy-sdk";
import { TransactionRowDto } from "../../models/txn_csv_row.dto";
import { DataProvider } from "../provider";
import axios, { AxiosInstance } from 'axios';
import { AlchemyBlockNumDto } from "./alchemy.dto";
import { getNumber, toBeHex, formatEther, BigNumberish } from 'ethers';

export class AlchemyDataProvider implements DataProvider {
    private apiKey: string;
    private alchemy: Alchemy;
    private axiosInstance: AxiosInstance;
    private readonly OFFSET = 100;

    constructor(apiKey: string) {
        this.apiKey = apiKey;

        const settings = {
            apiKey,
            network: Network.ETH_MAINNET,
        };

        this.alchemy = new Alchemy(settings);

        // Create axios instance with correct base URL for utility APIs
        this.axiosInstance = axios.create({
            baseURL: `https://api.g.alchemy.com/data/v1/${this.apiKey}`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `${this.apiKey}`
            }
        });
    }

    private toEth(wei: BigNumber) {
        return (Number(wei) / 1e18).toString();
    }

    private calcGasFee(tx: TransactionReceipt, isInternal: boolean = false): string {
        if (isInternal) {
            return '0'; // Internal transactions do not have gas fees in the same way
        }

        if (!tx.gasUsed || !tx.effectiveGasPrice) {
            throw new Error('Missing gasUsed or effectiveGasPrice in receipt');
        }

        const gasUsed = tx.gasUsed;
        const effectiveGasPrice = tx.effectiveGasPrice;

        const gasFee = gasUsed.mul(effectiveGasPrice); // in wei
        const gasFeeInEth = this.toEth(gasFee); // convert to ETH

        return gasFeeInEth;
    }

    fetchEthTransactionsStream(address: string, startDate?: Date, endDate?: Date): AsyncGenerator<TransactionRowDto, void, unknown> {
        throw new Error("Method not implemented.");
    }

    public async fetchEthTransactions(address: string, startDate: Date, endDate: Date): Promise<TransactionRowDto[]> {
        let [startBlock, endBlock] = ['0', 'latest']
        if (startDate != null && endDate != null) {
            [startBlock, endBlock] = await Promise.all([
                this.getBlockNumberByTimestamp(startDate, 'after'),
                this.getBlockNumberByTimestamp(endDate, 'before')
            ])
        } else {
            endBlock = await this.getLatestBlock();
        }

        console.log(`Fetching transactions for address: ${address}, from block: ${startBlock}, to block: ${endBlock}`);
        const [inTxn, outTxn] = await Promise.all([
            this.paginatedFetch<AssetTransfersWithMetadataResult>(null, address, startBlock, endBlock, [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.INTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721]),
            this.paginatedFetch<AssetTransfersWithMetadataResult>(address, null, startBlock, endBlock, [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.INTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721]),
        ]);

        const transactions: TransactionRowDto[] = [];
        const allTransactions = [...inTxn, ...outTxn];
        for await (const txn of allTransactions) {
            const txnInfo = await this.alchemy.core.getTransactionReceipt(txn.hash);
            if (!txnInfo) {
                console.warn(`Transaction not found for hash: ${txn.hash}`);
                continue;
            }
            const transaction: TransactionRowDto = {
                transactionHash: txn.hash,
                dateTime: new Date(txn.metadata.blockTimestamp).toISOString(),
                fromAddress: txn.from,
                toAddress: txn.to || '',
                transactionType: (txn.category === 'external' ? 'ETH transfer' : (txn.category === 'erc20' ? 'ERC-20 transfer' : (txn.category === 'erc721' ? 'ERC-721 transfer' : 'Internal transaction'))),
                assetContractAddress: txn.rawContract.address || '',
                assetSymbol: (txn.category === 'external' ? 'ETH' : (txn.category == 'erc20' ? txn.asset : '')), // This can be populated if needed
                tokenId: txn.erc721TokenId || txn.tokenId || '',
                valueAmount: txn.value ? txn.value.toString() : '0',
                gasFeeEth: this.calcGasFee(txnInfo, txn.category === 'internal'),
            };
            transactions.push(transaction);
        }

        return transactions;
    }

    private async getLatestBlock(): Promise<string> {
        const block = await this.alchemy.core.getBlockNumber();
        if (!block) {
            throw new Error('Failed to fetch latest block number');
        }
        return block.toString();
    }

    public async getBlockNumberByTimestamp(date: Date, closest: string): Promise<string> {
        try {
            const blockByTimestamp = await this.axiosInstance.get('/utility/blocks/by-timestamp', {
                params: {
                    networks: 'eth-mainnet',
                    timestamp: date.toISOString(),
                    direction: closest.toUpperCase(),
                }
            });
            if (blockByTimestamp.status !== 200 || !blockByTimestamp.data) {
                throw new Error(`Failed to fetch block number for date ${date}: ${blockByTimestamp.data.message}`);
            }

            const etherscanBlockDto: AlchemyBlockNumDto = blockByTimestamp.data;
            return `${etherscanBlockDto.data[0].block.number}`;
        } catch (error) {
            throw error;
        }
    }

    private async paginatedFetch<T extends any>(fromAddress: string, toAddress: string, startBlock: string, endBlock: string, actions: AssetTransfersCategory[]): Promise<AssetTransfersWithMetadataResult[]> {
        console.log(`Fetching ${actions} transactions for fromAddress: ${fromAddress}, toAddress: ${toAddress}, from block: ${startBlock}, to block: ${endBlock}, hex start block: ${toBeHex(startBlock)}, hex end block: ${toBeHex(endBlock)}`);
        let page = '0x0';
        let lastBlock = +startBlock;
        const results: AssetTransfersWithMetadataResult[] = [];
        const RATE_LIMIT_DELAY = 200;

        while (true) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
            const params = {
                fromBlock: toBeHex(lastBlock),
                toBlock: toBeHex(endBlock),
                category: actions,
                order: SortingOrder.ASCENDING,
                maxCount: this.OFFSET,
                withMetadata: true,
                excludeZeroValue: false
            } as AssetTransfersParams;
            if (page !== '0x0') {
                params.pageKey = page;
            }
            if (fromAddress) {
                params.fromAddress = fromAddress;
            }
            if (toAddress) {
                params.toAddress = toAddress;
            }
            const response = await this.alchemy.core.getAssetTransfers(params);
            if (!response || !response.transfers || response.transfers.length === 0) {
                break;
            }

            results.push(...response.transfers as AssetTransfersWithMetadataResult[]);
            lastBlock = getNumber(response.transfers[response.transfers.length - 1].blockNum) - 1;

            if (response.transfers.length < this.OFFSET) {
                break;
            }
            page = response.pageKey || '0x0';
        }
        return results;
    }

    // public async fetchNormalTransactions(address: string, startBlock: string, endBlock: string): Promise<AssetTransfersWithMetadataResult[]> {
    //     const [inTxn, outTxn] = await Promise.all([
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(null, address, startBlock, endBlock, AssetTransfersCategory.EXTERNAL),
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(address, null, startBlock, endBlock, AssetTransfersCategory.EXTERNAL),
    //     ]);
    //     return [...inTxn, ...outTxn];
    // }

    // public async fetchInternalTransactions(address: string, startBlock: string, endBlock: string): Promise<AssetTransfersWithMetadataResult[]> {
    //     const [inTxn, outTxn] = await Promise.all([
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(null, address, startBlock, endBlock, AssetTransfersCategory.INTERNAL),
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(address, null, startBlock, endBlock, AssetTransfersCategory.INTERNAL),
    //     ]);
    //     return [...inTxn, ...outTxn];
    // }

    // public async fetchERC20Transfers(address: string, startBlock: string, endBlock: string): Promise<AssetTransfersWithMetadataResult[]> {
    //     const [inTxn, outTxn] = await Promise.all([
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(null, address, startBlock, endBlock, AssetTransfersCategory.ERC20),
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(address, null, startBlock, endBlock, AssetTransfersCategory.ERC20),
    //     ]);
    //     return [...inTxn, ...outTxn];
    // }

    // public async fetchERC721Transfers(address: string, startBlock: string, endBlock: string): Promise<AssetTransfersWithMetadataResult[]> {
    //     const [inTxn, outTxn] = await Promise.all([
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(null, address, startBlock, endBlock, AssetTransfersCategory.ERC721),
    //         this.paginatedFetch<AssetTransfersWithMetadataResult>(address, null, startBlock, endBlock, AssetTransfersCategory.ERC721),
    //     ]);
    //     return [...inTxn, ...outTxn];
    // }
}