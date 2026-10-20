# Contributing to GitBack

Thanks for your interest in contributing! Here's how to get started.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

## Development Setup

```bash
# Clone the repo
git clone https://github.com/Haridharshini510/gitback.git
cd gitback

# Install dependencies
npm install

# Build all packages
npm run build
```

## Project Structure

```
gitback/
├── packages/
│   ├── core/       # Shared library — git, checkpoints, LLM, storage
│   ├── cli/        # CLI tool (gitback remember/resume/compare/status/config)
│   └── mcp/        # MCP server for AI coding agents
```

## Building

```bash
# Build everything
npm run build

# Build a specific package
npm run build:core
npm run build:cli
npm run build:mcp
```

## Testing the CLI locally

```bash
# Build, then run directly
npm run build:core && npm run build:cli
node packages/cli/dist/index.js help

# Or link it globally for development
cd packages/cli && npm link && cd ../..
gitback help
```

## Testing the MCP server locally

```bash
npm run build
npm run start:mcp
```

## Pull Request Process

1. Fork the repo and create a branch from `main`.
2. Make your changes. Keep PRs focused — one feature or fix per PR.
3. Ensure the project builds cleanly: `npm run build`.
4. Write a clear PR description explaining what changed and why.
5. Submit the PR. A maintainer will review it.

## Code Style

- TypeScript with `strict: true`.
- No unnecessary comments — code should be self-documenting.
- Prefer small, focused functions.
- No new dependencies without discussion — the project aims to stay lightweight.

## Reporting Issues

Use [GitHub Issues](https://github.com/Haridharshini510/gitback/issues) with the provided templates for bug reports and feature requests.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
