import { Alchemy, Network } from "alchemy-sdk";
import { TransactionRowDto } from "../../models/txn_csv_row.dto";
import { DataProvider } from "../provider";
import axios, { AxiosInstance } from 'axios';
import { AlchemyBlockNumDto } from "./alchemy.dto";

export class AlchemyDataProvider implements DataProvider {
    private apiKey: string;
    private alchemy: Alchemy;
    private axiosInstance: AxiosInstance;

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

    public async fetchNormalTransactions(address: string, startBlock: string, endBlock: string): Promise<any> {
        return null;
    }

    public async fetchInternalTransactions(address: string, startBlock: string, endBlock: string): Promise<any> {
        return null;
    }

    public async fetchERC20Transfers(address: string, startBlock: string, endBlock: string): Promise<any> {
        return null;
    }

    public async fetchERC721Transfers(address: string, startBlock: string, endBlock: string): Promise<any> {
        return null;
    }
}