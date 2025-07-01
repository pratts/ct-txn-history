require('dotenv').config();
export class ConfigDto {
    node_env: string;
    dataProvider: string;
    alchemyApiKey?: string;
    etherScanApiKey?: string;
    etherScanApiUrl?: string;
    etherScanEthChainId?: string;
    metamaskInfuraApiKey?: string;
    metamaskInfuraApiUrl?: string;

    public validate(): void {
        if (!this.node_env) {
            throw new Error('NODE_ENV is required');
        }
        if (!this.dataProvider) {
            throw new Error('DATA_PROVIDER is required');
        }
        if (this.dataProvider === 'etherscan' && (!this.etherScanApiKey || !this.etherScanApiUrl)) {
            throw new Error('ETHERSCAN_API_KEY is required for etherscan data provider');
        }
        if (this.dataProvider === 'alchemy' && !this.alchemyApiKey) {
            throw new Error('ALCHEMY_API_KEY is required for alchemy data provider');
        }
    }
}

export function loadConfig(): ConfigDto {
    console.log('process.env.NODE_ENV:', process.env);
    const config: ConfigDto = new ConfigDto();
    config.node_env = process.env.NODE_ENV || 'development';
    config.dataProvider = process.env.DATA_PROVIDER || 'etherscan';
    config.alchemyApiKey = process.env.ALCHEMY_API_KEY;
    config.etherScanApiKey = process.env.ETHERSCAN_API_KEY;
    config.etherScanApiUrl = process.env.ETHERSCAN_API_URL
    config.etherScanEthChainId = process.env.ETHERSCAN_ETH_CHAIN_ID || '1';
    config.metamaskInfuraApiKey = process.env.METAMASK_INFURA_API_KEY;
    config.metamaskInfuraApiUrl = process.env.METAMASK_INFURA_API_URL;

    return config;
}