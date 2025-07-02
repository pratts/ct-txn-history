export const mockNormalTransaction = {
    hash: '0x123456789abcdef',
    timeStamp: '1640995200', // 2022-01-01 00:00:00
    from: '0xabc123',
    to: '0xdef456',
    value: '1000000000000000000', // 1 ETH
    gasUsed: '21000',
    gasPrice: '20000000000', // 20 Gwei
    blockNumber: '13916165'
};

export const mockERC20Transfer = {
    hash: '0x987654321fedcba',
    timeStamp: '1640995200',
    from: '0xabc123',
    to: '0xdef456',
    contractAddress: '0xA0b86a33E6441493c83e5D49a4dC26F6B4BdBc6c',
    tokenSymbol: 'USDC',
    tokenDecimal: '6',
    value: '1000000', // 1 USDC
    gasUsed: '65000',
    gasPrice: '30000000000',
    blockNumber: '13916166'
};