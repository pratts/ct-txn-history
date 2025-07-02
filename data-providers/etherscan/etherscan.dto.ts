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

export class EtherScanBaseTransactionDto {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    contractAddress?: string;
    input: string;
    gasUsed: string;
    gasPrice?: string; // Optional, may not be present in all transaction types
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
    confirmations: string;
    methodId: string;
    functionName: string;
}

export class EtherScanInternalTransactionDto extends EtherScanBaseTransactionDto {
    type: string;
    gas: string;
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
    cumulativeGasUsed: string;
    methodId: string;
    functionName: string;
    confirmations: string;
}

