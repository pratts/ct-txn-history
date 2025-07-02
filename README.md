# ct-txn-history
Script to fetch and save Ethereum transaction history to a CSV

### Requirements
This project fetches Ethereum transaction history for a given address and exports it to a CSV file.

### Details
- Accepts an Ethereum address as input. Along with the address, user can provide the following optional parameters:
    - From Date - Start date for fetching transactions (default: 1 year ago)
    - To Date - End date for fetching transactions (default: current date)
- Fetches transaction history using the Etherscan/Alchemy. Currently the logic for Etherscan is complete.
- Extract & categorize transactions into
    - External(Normal) Transfers - These are direct transfers between user controlled addresses
    - Internal Transfers - These are transfers that occur within smart contracts & not directly initiated by users.
    - Token Transfers
        - ERC-20, ERC-721
- Saves the transaction history to a CSV file.
    - The CSV should include these essential fields for ETH transfers, ERC-20 tokens, ERC-721 NFTs, and ERC-1155 assets:
        - **Transaction Hash** – Unique identifier for the transaction
        - **Date & Time** – Transaction confirmation timestamp
        - **From Address** – Sender's Ethereum address
        - **To Address** – Recipient's Ethereum address or contract
        - **Transaction Type** – ETH transfer, ERC-20, ERC-721, ERC-1155, or contract interaction
        - **Asset Contract Address** – Contract address of the token or NFT (if applicable)
        - **Asset Symbol / Name** – Token symbol (e.g., ETH, USDC) or NFT collection name
        - **Token ID** – Unique identifier for NFTs (ERC-721, ERC-1155)
        - **Value / Amount** – Quantity of ETH or tokens transferred
        - **Gas Fee (ETH)** – Total transaction gas cost

### Design
- The script is designed to accept date range parameters to filter transactions. Example: A user might want to fetch for a financial year or a specific period.
- The script accepts an Ethereum address as input along with optional date range parameters.
- In case of no date range, the script defaults to fetching transactions for all blocks.
- The script uses Adapter pattern to support multiple data providers (Etherscan, Alchemy, etc.) for fetching transaction history. The implementation is chosen based on `DATA_PROVIDER` environment variable. Possible values are 
    - `etherscan` by default
    - `alchemy`
- All providers should `DataProvider` interface which defines `fetchEthTransactions` method to fetch transactions for a given address and date range.
- The script uses the `DataProviderFactory` to create an instance of the appropriate data provider based on the configuration.
- The script uses `dotenv` to load environment variables from a `.env` file, which contains API keys and other configuration details.
- Each data provider can implement logics to fetch various transaction types (normal, internal, token transfers) as per the provider's API capabilities and requirements.
- The script exports csv to an output folder.

### Assumptions
- The script assumes that the user has necessary API keys to Etherscan. Implementation for Alchemy is not in progress.
- The script assumes that the user has a valid Ethereum address to fetch transaction history. In case an invalid address is provided, the script will throw an error.
- The script assumes that the user has a valid date range to fetch transactions. If no date range is provided, it defaults to fetching transactions for all blocks.
- Since this is a command line script, with logic separated in different modules, the files can be plugged into a REST API or a Queue system to fetch transactions in a batch process.

### In progress
- The script currently supports Etherscan as the data provider. Implementation for Alchemy is not complete.
- The script currently supports fetching transactions for a given address and date range. It does not support fetching transactions for multiple addresses in a single run.
- The script currently does not support fetching transactions for ERC-1155 tokens. It only supports External, Internal, ERC-20 and ERC-721 transfers.

### Usage
- Clone the repository
- Install dependencies using `npm install`
- Rename the `.env.example` file to `.env` and provide the necessary API keys.
- Run the script using `npm run start -- <ETH_ADDRESS> [FROM_DATE] [TO_DATE]`
    - Example: `npm run start 0x123456789012345678901234567890123456789012345678 2022-01-01 2022-12-31`
- The script will fetch the transaction history for the given address and date range, and export it to a CSV file in the `output` folder with name `${address}_transactions.csv` file.