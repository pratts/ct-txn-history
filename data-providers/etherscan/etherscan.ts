import { DataProvider } from "../provider";

export class EtherscanProvider implements DataProvider {
    private apiKey: string;
    private apiUrl: string;

    constructor(apiKey: string, apiUrl: string) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
    }

    public async getBlockNumberByTimestamp(fromDate: string): Promise<string> {
        return null;
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