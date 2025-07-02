export class TransactionRowDto {
    transactionHash: string;
    dateTime: string;
    fromAddress: string;
    toAddress: string;
    transactionType: string; // ETH transfer, ERC-20, ERC-721, ERC-1155, contract interaction
    assetContractAddress?: string; // Contract address of the token or NFT (if applicable)
    assetSymbol?: string; // Token symbol (e.g., ETH, USDC) or NFT collection name
    tokenId?: string; // Unique identifier for NFTs (ERC-721, ERC-1155)
    valueAmount: string; // Quantity of ETH or tokens transferred
    gasFeeEth: string; // Total transaction gas cost in ETH
}