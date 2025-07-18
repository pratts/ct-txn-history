import { ConfigDto } from "../models/config.dto";
import { TransactionRowDto } from "../models/txn_csv_row.dto";
import { AlchemyDataProvider } from "./alchemy/alchemy";
import { EtherscanProvider } from "./etherscan/etherscan";

export interface DataProvider {
    fetchEthTransactions(address: string, startDate: Date, endDate: Date): Promise<TransactionRowDto[]>;
    fetchEthTransactionsStream(address: string, startDate?: Date, endDate?: Date): AsyncGenerator<TransactionRowDto, void, unknown>
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