import { DataProvider } from "../provider";
import { Axios } from 'axios';
import { EtherScanBlockNumDto } from "./etherscan.dto";

export class EtherscanProvider implements DataProvider {
    private apiKey: string;
    private apiUrl: string;
    private axiosInstance: Axios;

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

    public async fetchEthTransactions(address: string, startDate: Date, endDate: Date): Promise<any> {
        const [startBlock, endBlock] = await Promise.all([
            this.getBlockNumberByTimestamp(startDate, 'after'),
            this.getBlockNumberByTimestamp(endDate, 'before')
        ])
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