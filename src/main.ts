import * as core from '@actions/core'
import { wait } from './wait'
import fs from 'node:fs'
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    console.log('core')
    const www = fs.existsSync('dist')
    console.log('dist', www)
    const www2 = fs.existsSync('src')
    console.log('src', www2)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
