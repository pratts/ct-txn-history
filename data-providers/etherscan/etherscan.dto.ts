export class EtherScanBlockNumDto {
    status: string;
    message: string;
    result: string;
}

export class EtherScanResponseDto<T extends EtherScanBaseTransactionDto> {
    status: string;
    message: string;
    result: T[]
}

export class TransactionCSVRowDto {
    transactionHash: string;
    dateTime: Date;
    fromAddress: string;
    toAddress: string;
    transactionType: string; // ETH transfer, ERC-20, ERC-721, ERC-1155, contract interaction
    assetContractAddress?: string; // Contract address of the token or NFT (if applicable)
    assetSymbol?: string; // Token symbol (e.g., ETH, USDC) or NFT collection name
    tokenId?: string; // Unique identifier for NFTs (ERC-721, ERC-1155)
    valueAmount: string; // Quantity of ETH or tokens transferred
    gasFeeEth: string; // Total transaction gas cost in ETH
}

export class EtherScanBaseTransactionDto {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    contractAddress?: string;
    input: string;
}

export class EtherScanNormalTransactionDto extends EtherScanBaseTransactionDto {
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
    methodId: string;
    functionName: string;
}

export class EtherScanInternalTransactionDto extends EtherScanBaseTransactionDto {
    type: string;
    gas: string;
    gasUsed: string;
    traceId: string;
    isError: string;
    errCode: string;
}

export class EtherScanERC20TransferDto extends EtherScanBaseTransactionDto {
    blockHash: string;
    nonce: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    confirmations: string;
}

export class EtherScanERC721TransferDto extends EtherScanBaseTransactionDto {
    nonce: string;
    blockHash: string;
    tokenID: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    methodId: string;
    functionName: string;
    confirmations: string;
}

