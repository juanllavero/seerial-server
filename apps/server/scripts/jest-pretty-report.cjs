#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const rawArgs = process.argv.slice(2);
const userArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
const outputFile = path.join(os.tmpdir(), `jest-results-${process.pid}.json`);
const jestBin = require.resolve('jest/bin/jest');

const jestArgs = [jestBin, '--json', `--outputFile=${outputFile}`, ...userArgs];

const colors = {
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

function colorize(value, color) {
  return `${color}${value}${colors.reset}`;
}

function formatTests(value) {
  return colorize(String(value), colors.yellow);
}

function formatPassed(passed, tests) {
  if (passed === 0) {
    return colorize(String(passed), colors.red);
  }
  if (passed < tests) {
    return colorize(String(passed), colors.yellow);
  }
  return colorize(String(passed), colors.green);
}

function formatFailed(failed) {
  if (failed === 0) {
    return colorize(String(failed), colors.white);
  }
  return colorize(String(failed), colors.red);
}

function formatSummaryPart(count, label, tone) {
  const palette = {
    passed: colors.green,
    failed: colors.red,
    skipped: colors.yellow,
    total: colors.white,
    time: colors.gray,
  };

  const color = palette[tone] || colors.white;
  return `${colorize(String(count), color)} ${colorize(label, color)}`;
}

function stripAnsi(value) {
  return String(value).replace(/\x1B\[[0-9;]*m/g, '');
}

function padRight(value, width) {
  const raw = String(value);
  const visibleLength = stripAnsi(raw).length;
  const padding = Math.max(0, width - visibleLength);
  return `${raw}${' '.repeat(padding)}`;
}

function renderTable(rows) {
  const columns = [
    { key: 'type', label: 'type' },
    { key: 'file', label: 'file' },
    { key: 'tests', label: 'tests' },
    { key: 'passed', label: 'passed' },
    { key: 'failed', label: 'failed' },
  ];

  const widths = columns.map(({ key, label }) => {
    const maxContent = rows.reduce((acc, row) => {
      const len = stripAnsi(row[key] ?? '').length;
      return Math.max(acc, len);
    }, stripAnsi(label).length);
    return maxContent;
  });

  const drawLine = (left, middle, right) => {
    const chunks = widths.map((w) => '─'.repeat(w + 2));
    return `${left}${chunks.join(middle)}${right}`;
  };

  const header = `│ ${padRight(columns[0].label, widths[0])} │ ${padRight(columns[1].label, widths[1])} │ ${padRight(columns[2].label, widths[2])} │ ${padRight(columns[3].label, widths[3])} │ ${padRight(columns[4].label, widths[4])} │`;

  console.log(drawLine('┌', '┬', '┐'));
  console.log(header);
  console.log(drawLine('├', '┼', '┤'));

  for (const row of rows) {
    console.log(
      `│ ${padRight(row.type ?? '', widths[0])} │ ${padRight(row.file ?? '', widths[1])} │ ${padRight(row.tests ?? '', widths[2])} │ ${padRight(row.passed ?? '', widths[3])} │ ${padRight(row.failed ?? '', widths[4])} │`,
    );
  }

  console.log(drawLine('└', '┴', '┘'));
}

function runJestWithSpinner() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, jestArgs, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    const frames = ['', '.', '..', '...', '....', '.....', '....', '...', '..', '.'];
    let frameIndex = 0;
    process.stdout.write('\n');
    const interval = setInterval(() => {
      const frame = frames[frameIndex % frames.length];
      frameIndex += 1;
      const text = `Testing${frame}`;
      process.stdout.write(`\r${text.padEnd(20, ' ')}`);
    }, 90);

    child.on('error', (error) => {
      clearInterval(interval);
      process.stdout.write('\r');
      process.stdout.write(' '.repeat(40));
      process.stdout.write('\r');
      reject(error);
    });

    child.on('close', (code) => {
      clearInterval(interval);
      process.stdout.write('\r');
      process.stdout.write(' '.repeat(40));
      process.stdout.write('\r');
      resolve({ code, stdout, stderr });
    });
  });
}

function resolveTestType(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/__tests__/unit/')) {
    return 'unit';
  }
  if (normalized.includes('/__tests__/integration/')) {
    return 'integration';
  }
  if (normalized.includes('/__tests__/live/')) {
    return 'live';
  }
  return 'other';
}

async function main() {
  let result;
  try {
    result = await runJestWithSpinner();
  } catch (error) {
    console.error('Failed to run Jest:', error.message);
    process.exit(1);
  }

  if (!fs.existsSync(outputFile)) {
    const fallbackErr = (result.stderr || result.stdout || '').trim();
    if (fallbackErr) {
      console.error(fallbackErr);
    }
    console.error('Jest JSON result file was not generated.');
    process.exit(result.code ?? 1);
  }

  const report = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
  try {
    fs.unlinkSync(outputFile);
  } catch {
    // ignore cleanup errors
  }

  const grouped = new Map();
  for (const suite of report.testResults) {
    const testType = resolveTestType(suite.name);
    if (!grouped.has(testType)) {
      grouped.set(testType, []);
    }
    grouped.get(testType).push(suite);
  }

  const preferredOrder = ['unit', 'integration', 'live', 'other'];
  const orderedTypes = preferredOrder.filter((t) => grouped.has(t));

  const rows = [];
  for (const testType of orderedTypes) {
    const suites = grouped.get(testType);
    const suiteCount = suites.length;
    const testCount = suites.reduce((acc, suite) => acc + suite.assertionResults.length, 0);
    const passedCount = suites.reduce(
      (acc, suite) => acc + suite.assertionResults.filter((a) => a.status === 'passed').length,
      0,
    );
    const failedCount = suites.reduce(
      (acc, suite) => acc + suite.assertionResults.filter((a) => a.status === 'failed').length,
      0,
    );

    rows.push({
      type: testType,
      file: `(total ${suiteCount} suites)`,
      tests: formatTests(testCount),
      passed: formatPassed(passedCount, testCount),
      failed: formatFailed(failedCount),
    });

    const suiteRows = suites
      .map((suite) => {
        const relativeName = path.relative(process.cwd(), suite.name) || suite.name;
        const tests = suite.assertionResults.length;
        const passed = suite.assertionResults.filter((a) => a.status === 'passed').length;
        const failed = suite.assertionResults.filter((a) => a.status === 'failed').length;

        return {
          type: '',
          file: relativeName,
          tests: formatTests(tests),
          passed: formatPassed(passed, tests),
          failed: formatFailed(failed),
        };
      })
      .sort((a, b) => a.file.localeCompare(b.file));

    rows.push(...suiteRows);
  }

  console.log('\n=== Test Matrix ===');
  renderTable(rows);

  const totalSkipped = report.numPendingTests + report.numTodoTests;
  const runtimeSec = (
    report.testResults.reduce(
      (acc, suite) => acc + (suite.endTime && suite.startTime ? suite.endTime - suite.startTime : 0),
      0,
    ) / 1000
  ).toFixed(2);

  const skippedSuites = report.numPendingTestSuites || 0;

  console.log('\n=== Jest Summary ===');
  console.log(
    `${colorize('Suites:', colors.white)} ${formatSummaryPart(report.numPassedTestSuites, 'passed', 'passed')}, ${formatSummaryPart(report.numFailedTestSuites, 'failed', 'failed')}, ${formatSummaryPart(skippedSuites, 'skipped', 'skipped')}, ${formatSummaryPart(report.numTotalTestSuites, 'total', 'total')}`,
  );
  console.log(
    `${colorize('Tests:', colors.white)} ${formatSummaryPart(report.numPassedTests, 'passed', 'passed')}, ${formatSummaryPart(report.numFailedTests, 'failed', 'failed')}, ${formatSummaryPart(totalSkipped, 'skipped', 'skipped')}, ${formatSummaryPart(report.numTotalTests, 'total', 'total')}`,
  );
  console.log(`${colorize('Time:', colors.white)} ${formatSummaryPart(`${runtimeSec}s`, '', 'time').trim()}`);

  process.exit(result.code ?? 1);
}

main();
