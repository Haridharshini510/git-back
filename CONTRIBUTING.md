# Contributing to GitBack

Thank you for your interest in contributing to GitBack! This document will help you get started.

## Code of Conduct

Be respectful, constructive, and kind. We're all here to build something useful together.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/git-back.git
cd git-back
```

2. **Install dependencies**

```bash
npm install
```

3. **Build all packages**

```bash
npm run build
```

4. **Test locally**

```bash
# Test the CLI
node packages/cli/dist/index.js help

# Test in a git repository
cd /path/to/some/git/repo
node /path/to/git-back/packages/cli/dist/index.js remember "Testing GitBack"
node /path/to/git-back/packages/cli/dist/index.js resume
```

## Project Structure

```
git-back/
├── packages/
│   ├── core/           # Core library (shared code)
│   │   ├── src/
│   │   │   ├── checkpoint.ts    # Checkpoint creation
│   │   │   ├── git.ts           # Git operations
│   │   │   ├── llm.ts           # LLM integration
│   │   │   ├── storage-local.ts # Local storage
│   │   │   ├── evidence.ts      # Evidence gathering
│   │   │   ├── todos.ts         # TODO scanning
│   │   │   ├── project.ts       # Project identity
│   │   │   └── types.ts         # TypeScript types
│   │   └── package.json
│   │
│   ├── cli/            # CLI tool
│   │   ├── src/
│   │   │   └── index.ts         # CLI commands
│   │   └── package.json
│   │
│   └── mcp/            # MCP server
│       ├── src/
│       │   ├── index.ts         # MCP server setup
│       │   └── tools/           # MCP tool handlers
│       └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml      # CI/CD pipeline
├── README.md
└── CONTRIBUTING.md
```

## Build Commands

```bash
# Build everything
npm run build

# Build individual packages
npm run build:core
npm run build:cli
npm run build:mcp

# Start MCP server
npm run start:mcp
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Keep functions small and focused

### 3. Test Your Changes

```bash
# Build to check for TypeScript errors
npm run build

# Test manually
node packages/cli/dist/index.js <command>
```

### 4. Commit Your Changes

Write clear commit messages:

```bash
git commit -m "Add support for custom checkpoint tags"
# or
git commit -m "Fix: Resume command fails when no checkpoint exists"
```

Good commit message format:
```
<type>: <short description>

<longer description if needed>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear title describing the change
- Description of what changed and why
- Reference any related issues (`Fixes #123`)

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Follow existing patterns
- **Naming**:
  - Functions: camelCase (`createCheckpoint`)
  - Types/Interfaces: PascalCase (`Checkpoint`)
  - Constants: UPPER_SNAKE_CASE (`TODO_PATTERN`)
- **Imports**: Use explicit `.js` extensions for ES modules
- **No external dependencies**: Keep `core` package minimal

## Areas to Contribute

### Good First Issues

- Improve error messages
- Add more examples to README
- Fix typos in documentation
- Add tests for existing functions

### Feature Ideas

- **Better TODO detection**: Support more comment patterns
- **Diff visualization**: Better formatting for diffs
- **Export/Import**: Share checkpoints between machines
- **Git hooks**: Auto-checkpoint on branch switch
- **Search**: Find checkpoints by keyword or tag
- **Statistics**: Show project activity graphs
- **Integration**: VSCode extension, GitHub Action

### Core Improvements

- Add tests (currently no test suite!)
- Better error handling in git operations
- Performance optimization for large repos
- Support for more LLM providers
- Structured output formats (JSON, YAML)

## Testing

Currently, GitBack relies on manual testing. Adding automated tests would be a valuable contribution!

Areas that need tests:
- Git operations (checkout, status, diff parsing)
- Checkpoint creation and storage
- Evidence gathering logic
- LLM integration
- CLI commands

## LLM Integration

When working on LLM features:

- Test with multiple providers (Ollama, OpenRouter, OpenAI)
- Handle API failures gracefully
- Keep prompts clear and structured
- Make AI features optional (GitBack works without LLM)

## Documentation

When adding features:

- Update README.md with new commands/options
- Add examples showing how to use it
- Document environment variables
- Update the "All Commands" section if adding commands

## Publishing

Maintainers can publish to npm:

```bash
npm run build
npm publish --workspace packages/core
npm publish --workspace packages/cli
npm publish --workspace packages/mcp
```

Or use the convenience script:

```bash
npm run publish:all
```

## Questions?

- **Bug reports**: Open an issue with reproduction steps
- **Feature requests**: Open an issue describing the use case
- **Questions**: Open a discussion or issue

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to GitBack! 🚀
