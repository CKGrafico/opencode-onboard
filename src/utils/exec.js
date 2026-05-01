import chalk from 'chalk'
import { execa } from 'execa'
import ora from 'ora'

// ── Screen / step state ──────────────────────────────────────────────────────

const previousSteps = []    // up to 2 completed steps, each is an array of lines
let currentStepLines = []   // lines accumulated in the current step
let stepSpinner = null      // ora spinner shown while step is working

function appendLine(line) {
  currentStepLines.push(line)
}

function stopSpinner() {
  if (stepSpinner) {
    stepSpinner.stop()
    stepSpinner = null
  }
}

function redraw() {
  console.clear()

  // Show up to 2 previous steps dimmed
  for (const stepLines of previousSteps) {
    for (const line of stepLines) {
      process.stdout.write(chalk.dim(line) + '\n')
    }
    process.stdout.write('\n')
  }

  // Current step output
  for (const line of currentStepLines) {
    process.stdout.write(line + '\n')
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Run a shell command with a spinner.
 * Returns { success, stdout, stderr }
 */
export async function run(command, args = [], { label, cwd = process.cwd() } = {}) {
  const spinner = ora(label ?? `${command} ${args.join(' ')}`).start()
  try {
    const result = await execa(command, args, { cwd, reject: false })
    if (result.exitCode === 0) {
      spinner.succeed()
    } else {
      spinner.fail()
    }
    return { success: result.exitCode === 0, stdout: result.stdout, stderr: result.stderr }
  } catch (err) {
    spinner.fail()
    return { success: false, stdout: '', stderr: err.message }
  }
}

/**
 * Check if a command is available on PATH.
 * Returns true/false.
 */
export async function commandExists(command) {
  try {
    const result = await execa(command, ['--version'], { reject: false })
    return result.exitCode === 0
  } catch {
    return false
  }
}

/**
 * Print a section header — clears screen, shows previous step dimmed, starts new step.
 */
export function header(text) {
  // Rotate buffers — keep last 2 completed steps
  previousSteps.push(currentStepLines)
  if (previousSteps.length > 2) previousSteps.shift()
  currentStepLines = []

  const line1 = ''
  const line2 = chalk.bold.hex('#fe3d57')(`━━ ${text}`)
  const line3 = ''

  appendLine(line1)
  appendLine(line2)
  appendLine(line3)

  redraw()

  // Start a spinner while the step is working
  stepSpinner = ora({ text: chalk.dim('working...'), color: 'red' }).start()
}

/**
 * Print a success line.
 */
export function success(text) {
  stopSpinner()
  const line = chalk.green('✓ ') + text
  appendLine(line)
  console.log(line)
}

/**
 * Print a warning line.
 */
export function warn(text) {
  stopSpinner()
  const line = chalk.yellow('⚠ ') + text
  appendLine(line)
  console.log(line)
}

/**
 * Print an error line.
 */
export function error(text) {
  stopSpinner()
  const line = chalk.red('✗ ') + text
  appendLine(line)
  console.log(line)
}

/**
 * Print an info line.
 */
export function info(text) {
  stopSpinner()
  const line = chalk.dim('  ' + text)
  appendLine(line)
  console.log(line)
}

/**
 * Print an action prompt line (white bold — requires user interaction).
 */
export function prompt(text) {
  stopSpinner()
  const line = chalk.bold('  ' + text)
  appendLine(line)
  console.log(line)
}

/**
 * Print a code block.
 */
export function code(lines) {
  stopSpinner()
  appendLine('')
  console.log()
  for (const line of lines) {
    const formatted = chalk.bgGray.white('  ' + line + '  ')
    appendLine(formatted)
    console.log(formatted)
  }
  appendLine('')
  console.log()
}
