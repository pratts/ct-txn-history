import { DataProvider } from "../provider";

export class AlchemyDataProvider implements DataProvider {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    public async fetchEthTransactions(address: string, startDate: Date, endDate: Date): Promise<any> {
        throw new Error("Method not implemented.");
    }

    public async getBlockNumberByTimestamp(date: Date, closest: string): Promise<string> {
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