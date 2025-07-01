import { ConfigDto } from "../models/config.dto";
import { AlchemyDataProvider } from "./alchemy/alchemy";
import { EtherscanProvider } from "./etherscan/etherscan";

export interface DataProvider {
    getBlockNumberByTimestamp(fromDate: string): Promise<string>;
    fetchNormalTransactions(address: string, startBlock: string, endBlock: string): Promise<any>;
    fetchInternalTransactions(address: string, startBlock: string, endBlock: string): Promise<any>;
    fetchERC20Transfers(address: string, startBlock: string, endBlock: string): Promise<any>;
    fetchERC721Transfers(address: string, startBlock: string, endBlock: string): Promise<any>;
}

export class DataProviderFactory {
    public static getProvider(config: ConfigDto): DataProvider {
        switch (config.dataProvider) {
            case "etherscan":
                return new EtherscanProvider(config.etherScanApiKey, config.etherScanApiUrl);
            case "alchemy":
                return new AlchemyDataProvider(config.alchemyApiKey);
            default:
                throw new Error(`Unsupported data provider: ${config.dataProvider}`);
        }
    }
}