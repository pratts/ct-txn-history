# ct-txn-history

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Ethereum transaction history fetcher with CSV export capabilities

## Overview

This project fetches comprehensive Ethereum transaction history for any address and exports it to structured CSV files. Built with TypeScript and designed for production use, it handles everything from simple transfers to complex DeFi interactions.

## 🚀 Features

- ✅ **Complete Transaction Coverage**: ETH transfers, ERC-20 tokens, ERC-721 NFTs, internal transactions
- ✅ **Flexible Date Filtering**: Fetch specific time ranges or complete history
- ✅ **Streaming Support**: Handle large datasets (100K+ transactions) efficiently
- ✅ **Multiple Data Providers**: Pluggable architecture (Etherscan implemented, Alchemy ready)
- ✅ **Production Ready**: Comprehensive error handling, rate limiting, validation
- ✅ **High Test Coverage**: 95% test coverage with unit & integration tests

## 📋 Prerequisites

- **Node.js** 20+ (recommended: 22+)
- **npm** or **yarn**
- **Etherscan API Key** ([Get free key here](https://etherscan.io/apis))

## ⚡ Quick Start

```bash
# Clone and setup
git clone https://github.com/pratts/ct-txn-history.git
cd ct-txn-history
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your ETHERSCAN_API_KEY

# Run tests
npm test

# Fetch transactions
npm run start 0xa39b189482f984388a34460636fea9eb181ad1a6 2023-01-01 2023-12-31
```

## 🏗️ Architecture Highlights

| Feature | Description |
|---------|-------------|
| **Provider Pattern** | Easily swap between Etherscan/Alchemy/other APIs |
| **Streaming Support** | Handle large datasets without memory issues |
| **Comprehensive Testing** | 95% test coverage with unit & integration tests |
| **Production Ready** | Error handling, rate limiting, validation built-in |

## 📊 Performance Considerations
**Rate Limiting**: 5 requests/second (Etherscan free tier)

## 📁 CSV Output Format

The exported CSV includes these essential fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Transaction Hash** | Unique transaction identifier | `0x123...abc` |
| **Date & Time** | Transaction timestamp | `2023-01-01T00:00:00.000Z` |
| **From Address** | Sender's Ethereum address | `0xabc...123` |
| **To Address** | Recipient's address or contract | `0xdef...456` |
| **Transaction Type** | Category of transaction | `ETH transfer`, `ERC-20 transfer` |
| **Asset Contract Address** | Token/NFT contract (if applicable) | `0x789...def` |
| **Asset Symbol/Name** | Token symbol or NFT collection | `ETH`, `USDC`, `CryptoPunks` |
| **Token ID** | NFT identifier (ERC-721/1155) | `1234` |
| **Value/Amount** | Quantity transferred | `1.5`, `1000.00` |
| **Gas Fee (ETH)** | Total transaction cost | `0.002` |

## 🔧 Usage

### Basic Usage
```bash
# All transactions for an address
npm run start 0xa39b189482f984388a34460636fea9eb181ad1a6

# Transactions within date range
npm run start 0xa39b189482f984388a34460636fea9eb181ad1a6 2023-01-01 2023-12-31

# Streaming mode for large addresses
npm run start-stream 0xfb50526f49894b78541b776f5aaefe43e3bd8590 2024-01-01 2024-01-31
```

### Supported Transaction Types

- **External Transfers**: Direct ETH transfers between addresses
- **Internal Transfers**: Contract-generated ETH transfers
- **ERC-20 Transfers**: Token transfers (USDC, DAI, etc.)
- **ERC-721 Transfers**: NFT transfers (CryptoPunks, BAYC, etc.)

## ⚙️ Configuration

### Environment Variables

```env
# Required: Etherscan API Configuration
ETHERSCAN_API_KEY=your_etherscan_api_key_here
ETHERSCAN_API_URL=https://api.etherscan.io

# Optional: Data Provider Selection
DATA_PROVIDER=etherscan

# Future: Alchemy Configuration (not implemented)
# ALCHEMY_API_KEY=your_alchemy_api_key_here
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Standard Mode** | `npm run start` | Regular processing, loads all data in memory |
| **Streaming Mode** | `npm run start-stream` | Memory-efficient streaming for large datasets |
| **Tests** | `npm test` | Run test suite |
| **Test Coverage** | `npm run test:coverage` | Generate coverage report |
| **Watch Tests** | `npm run test:watch` | Run tests in watch mode |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- csv-exporter.test.ts

# Watch mode for development
npm run test:watch
```

**Test Coverage**: 95%+ with comprehensive unit and integration tests

## 🏛️ System Design

### Provider Architecture
```typescript
interface DataProvider {
  fetchEthTransactions(address: string, startDate?: Date, endDate?: Date): Promise<TransactionRowDto[]>;
  getBlockNumberByTimestamp(date: Date, closest: string): Promise<string>;
  // ... other methods
}
```

### Dual Processing Modes

**Standard Mode** (`main.ts`):
- Loads all transactions in memory
- Best for addresses with <50K transactions
- Simple, straightforward processing

**Streaming Mode** (`main-stream.ts`):
- Processes transactions as they arrive
- Memory-efficient for large datasets
- Handles 100K+ transactions without issues

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Rate Limit Exceeded** | Wait 1 minute and retry |
| **Large Address Timeout** | Use date ranges or streaming mode |
| **Memory Issues** | Switch to `npm run start-stream` |
| **Invalid Address Error** | Verify Ethereum address format (0x...) |
| **API Key Error** | Check `.env` file has valid `ETHERSCAN_API_KEY` |

## 🔮 Future Enhancements

- [ ] **Alchemy Provider**: Complete Alchemy API implementation
- [ ] **ERC-1155 Support**: Multi-token standard support
- [ ] **Multi-Address Batch**: Process multiple addresses in one run
- [ ] **Advanced DeFi Parsing**: Uniswap, Compound, Aave transaction details
- [ ] **REST API**: Web service wrapper for the CLI tool
- [ ] **Database Integration**: Direct database storage option

## 🎯 Project Goals

This project was built as part of a technical assessment for CoinTracker, demonstrating:

- **Clean Architecture**: Provider pattern, dependency injection, separation of concerns
- **Production Quality**: Comprehensive error handling, testing, and documentation  
- **Scalability**: Streaming support for large datasets, rate limiting, efficient pagination
- **Maintainability**: TypeScript, modular design, extensible provider system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ct-txn-history.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and add your API keys
5. Run tests: `npm test`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CoinTracker** for the inspiring technical challenge
- **Etherscan** for providing comprehensive Ethereum data APIs
- **Ethereum Community** for building the decentralized future