import { DataProvider } from "../provider";
import { Axios } from 'axios';
import { EtherScanBaseTransactionDto, EtherScanBlockNumDto, EtherScanERC20TransferDto, EtherScanERC721TransferDto, EtherScanInternalTransactionDto, EtherScanNormalTransactionDto, EtherScanResponseDto } from "./etherscan.dto";

export class EtherscanProvider implements DataProvider {
    private apiKey: string;
    private apiUrl: string;
    private axiosInstance: Axios;
    private readonly OFFSET = 10;

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
        let [startBlock, endBlock] = ['0', 'latest']
        if (startDate != null && endDate != null) {
            [startBlock, endBlock] = await Promise.all([
                this.getBlockNumberByTimestamp(startDate, 'after'),
                this.getBlockNumberByTimestamp(endDate, 'before')
            ])
        }

        console.log('startBlock:', startBlock, 'endBlock:', endBlock);
        // Fetch transactions in a paginated manner
        const normalTransactions = await this.fetchNormalTransactions(address, startBlock, endBlock);
        const internalTransactions = await this.fetchInternalTransactions(address, startBlock, endBlock);
        const erc20Transfers = await this.fetchERC20Transfers(address, startBlock, endBlock);
        const erc721Transfers = await this.fetchERC721Transfers(address, startBlock, endBlock);

        console.log('normalTransactions:', normalTransactions);
        console.log('internalTransactions:', internalTransactions);
        console.log('erc20Transfers:', erc20Transfers);
        console.log('erc721Transfers:', erc721Transfers);
        return {
            normalTransactions,
            // internalTransactions,
            // erc20Transfers,
            // erc721Transfers
        };
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
                    startblock: +startBlock,
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
            lastBlock = +response.result[response.result.length - 1].blockNumber - 1;

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
}