import { Alchemy, AssetTransfersCategory, AssetTransfersResult, Network, SortingOrder } from "alchemy-sdk";
import { TransactionRowDto } from "../../models/txn_csv_row.dto";
import { DataProvider } from "../provider";
import axios, { AxiosInstance } from 'axios';
import { AlchemyBlockNumDto } from "./alchemy.dto";
import { getNumber, toBeHex } from 'ethers';

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

    fetchEthTransactionsStream(address: string, startDate?: Date, endDate?: Date): AsyncGenerator<TransactionRowDto, void, unknown> {
        throw new Error("Method not implemented.");
    }

    public async fetchEthTransactions(address: string, startDate: Date, endDate: Date): Promise<any> {
        let [startBlock, endBlock] = ['0', 'latest']
        if (startDate != null && endDate != null) {
            [startBlock, endBlock] = await Promise.all([
                this.getBlockNumberByTimestamp(startDate, 'after'),
                this.getBlockNumberByTimestamp(endDate, 'before')
            ])
        }

        const [normalTransactions, internalTransactions, erc20Transfers, erc721Transfers] = await Promise.all([
            this.fetchNormalTransactions(address, startBlock, endBlock),
            this.fetchInternalTransactions(address, startBlock, endBlock),
            this.fetchERC20Transfers(address, startBlock, endBlock),
            this.fetchERC721Transfers(address, startBlock, endBlock)
        ]);
        console.log('normalTransactions: ', normalTransactions);
        console.log('internalTransactions: ', internalTransactions);
        console.log('erc20Transfers: ', erc20Transfers);
        console.log('erc721Transfers: ', erc721Transfers);

        throw new Error("Method not implemented.");
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

    private async paginatedFetch<T extends any>(address: string, startBlock: string, endBlock: string, action: AssetTransfersCategory): Promise<T[]> {
        console.log(`Fetching ${action} transactions for address: ${address}, from block: ${startBlock}, to block: ${endBlock}, hex start block: ${toBeHex(startBlock)}, hex end block: ${toBeHex(endBlock)}`);
        let page = 1;
        let lastBlock = +startBlock;
        const results: T[] = [];
        const RATE_LIMIT_DELAY = 200;

        while (true) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
            const response = await this.alchemy.core.getAssetTransfers({
                fromAddress: address,
                fromBlock: toBeHex(lastBlock - 1),
                toBlock: toBeHex(endBlock),
                category: [action],
                order: SortingOrder.ASCENDING,
                // pageKey: `${page}`,
                maxCount: this.OFFSET
            })
            console.log('Fetched page: ', page, ' for action: ', action, ' response: ', response);
            if (!response || !response.transfers || response.transfers.length === 0) {
                break;
            }

            results.push(...response.transfers as T[]);
            lastBlock = getNumber(response.transfers[response.transfers.length - 1].blockNum)

            if (response.transfers.length < this.OFFSET) {
                break;
            }
            page++;
        }
        return results;
    }

    public async fetchNormalTransactions(address: string, startBlock: string, endBlock: string): Promise<any> {
        return this.paginatedFetch<AssetTransfersResult>(address, startBlock, endBlock, AssetTransfersCategory.EXTERNAL);
    }

    public async fetchInternalTransactions(address: string, startBlock: string, endBlock: string): Promise<any> {
        return await this.paginatedFetch<AssetTransfersResult>(address, startBlock, endBlock, AssetTransfersCategory.INTERNAL);
    }

    public async fetchERC20Transfers(address: string, startBlock: string, endBlock: string): Promise<any> {
        return this.paginatedFetch<AssetTransfersResult>(address, startBlock, endBlock, AssetTransfersCategory.ERC20);
    }

    public async fetchERC721Transfers(address: string, startBlock: string, endBlock: string): Promise<any> {
        return this.paginatedFetch<AssetTransfersResult>(address, startBlock, endBlock, AssetTransfersCategory.ERC721);
    }
}