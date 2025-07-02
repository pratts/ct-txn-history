# Contributing to CT Transaction History

## Development Setup
1. Fork the repository
2. Clone your fork: `git clone git@github.com:pratts/ct-txn-history.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and add your API keys
5. Run tests: `npm test`

## Adding New Data Providers
1. Create a new provider class implementing `DataProvider` interface
2. Add the provider to `DataProviderFactory`
3. Update environment variables and documentation
4. Add tests cases

## Code Style
- Use TypeScript strict mode
- Follow existing error handling patterns
- Add tests for new functionality
- Update README for new features