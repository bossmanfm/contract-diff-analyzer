# Contract Diff Analyzer

Compare two versions of smart contracts and highlight changes. Useful for security reviews before upgrades.

## Features

- Compare contract source files side-by-side
- Detect function additions/removals/modifications
- Highlight storage layout changes (critical for upgrades!)
- Export diff report to JSON/Markdown

## Setup

```bash
npm install
```

## Usage

```bash
# Compare two files
node src/cli.js diff old/Token.sol new/Token.sol

# Compare with report output
node src/cli.js diff old/Token.sol new/Token.sol --output report.json

# Check storage layout changes
node src/cli.js storage old/Token.sol new/Token.sol
```

## Example Output

```
📊 Contract Diff Report

Functions Changed:
  + mint(address,uint256) [NEW]
  ~ transfer(address,uint256) [MODIFIED]
  - burn(uint256) [REMOVED]

⚠️  Storage Layout Changes Detected!
  Variable 'totalSupply' position changed
```

## License

MIT
