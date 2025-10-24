# Testing Guide

This project uses Jest for unit testing.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (auto-rerun on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

The test suite is located in `converter.test.js` and covers:

### 1. `convert()` Function Tests
- ✓ Simplified to Traditional Chinese conversion
- ✓ Complex Chinese text handling
- ✓ English text preservation
- ✓ Mixed Chinese and English text
- ✓ Empty string handling
- ✓ Special characters and numbers

### 2. `shouldConvertFile()` Function Tests
- ✓ SNBT file detection
- ✓ OpenLoader file detection
- ✓ Chinese language file detection (zh_cn, zh-cn, all case variations)
- ✓ English language file detection with `convertEnUs` flag
- ✓ Non-language file filtering

### 3. `convertFilePath()` Function Tests
- ✓ Case preservation for all variations:
  - `zh_cn` → `zh_tw`
  - `zh_CN` → `zh_TW`
  - `ZH_CN` → `ZH_TW`
  - `Zh_Cn` → `Zh_Tw`
  - `zh-cn` → `zh-tw`
  - `zh-CN` → `zh-TW`
  - `ZH-CN` → `ZH-TW`
  - `Zh-Cn` → `Zh-Tw`
- ✓ English to Chinese conversion with case preservation
- ✓ Complex path handling
- ✓ Non-matching path preservation

### 4. `processZipFile()` Function Tests
- ✓ ZIP file processing with zh_cn files
- ✓ English-only file handling with `convertEnUs` flag
- ✓ Mixed zh_cn and en_us file handling
- ✓ Case preservation in file paths
- ✓ SNBT file handling
- ✓ Non-language file skipping

### 5. `processFolderPath()` Function Tests
- ✓ Folder processing with zh_cn files
- ✓ English-only file handling with `convertEnUs` flag
- ✓ Mixed zh_cn and en_us file handling

## Test Coverage

Current test coverage (as of last run):

```
--------------|---------|----------|---------|---------|---------
File          | % Stmts | % Branch | % Funcs | % Lines |
--------------|---------|----------|---------|---------|---------
converter.js  |   83.12 |    79.34 |     100 |   88.43 |
--------------|---------|----------|---------|---------|---------
```

- **Statements**: 83.12%
- **Branches**: 79.34%
- **Functions**: 100%
- **Lines**: 88.43%

Uncovered lines are mainly:
- Error handling paths
- Progress callback implementations
- Directory creation edge cases

## Test Statistics

- **Total Tests**: 42
- **Test Suites**: 1
- **Pass Rate**: 100%

## Adding New Tests

When adding new functionality to `converter.js`, please:

1. Add corresponding tests to `converter.test.js`
2. Follow the existing test structure and naming conventions
3. Ensure all tests pass before committing
4. Aim to maintain or improve code coverage

## Continuous Integration

Tests should be run before:
- Committing changes
- Creating pull requests
- Building releases

You can add a pre-commit hook to automatically run tests:

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm test
```
