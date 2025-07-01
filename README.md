# ct-txn-history
Script to fetch and save Ethereum transaction history to a CSV

### Requirements
This project fetches Ethereum transaction history for a given address and exports it to a CSV file.

### Details
- Accepts an Ethereum address as input. Along with the address, user can provide the following optional parameters:
    - From Date - Start date for fetching transactions (default: 1 year ago)
    - To Date - End date for fetching transactions (default: current date)
- Fetches transaction history using the Etherscan/Alchemy/Blockscout/Infura API.
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