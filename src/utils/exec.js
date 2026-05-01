import chalk from 'chalk'
import { execa } from 'execa'
import ora from 'ora'

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
 * Print a section header.
 */
export function header(text) {
  console.log()
  console.log(chalk.bold.cyan(`━━ ${text}`))
  console.log()
}

/**
 * Print a success line.
 */
export function success(text) {
  console.log(chalk.green('✓ ') + text)
}

/**
 * Print a warning line.
 */
export function warn(text) {
  console.log(chalk.yellow('⚠ ') + text)
}

/**
 * Print an error line.
 */
export function error(text) {
  console.log(chalk.red('✗ ') + text)
}

/**
 * Print an info line.
 */
export function info(text) {
  console.log(chalk.dim('  ' + text))
}

/**
 * Print an action prompt line (white bold — requires user interaction).
 */
export function prompt(text) {
  console.log(chalk.bold('  ' + text))
}

/**
 * Print a code block.
 */
export function code(lines) {
  console.log()
  for (const line of lines) {
    console.log(chalk.bgGray.white('  ' + line + '  '))
  }
  console.log()
}
