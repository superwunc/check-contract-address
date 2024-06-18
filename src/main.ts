import * as core from '@actions/core'

import fs from 'node:fs'
import _ from 'lodash'
// Recursive function to get files
function getFiles(dir: string, files: string[] = []) {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir)
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFiles(name, files)
    } else {
      // If it is a file, push the full path to the files array
      files.push(name)
    }
  }
  return files
}
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const files = getFiles('src')
    const allContractAddress = new Set()
    for (let i = 0, l = files.length; i < l; i++) {
      if (files[i].endsWith('.svg')) {
        continue
      }
      const content: string = fs.readFileSync(files[i], 'utf8')
      const regex = /(0x[0-9a-zA-Z]{40})/gm
      let m
      while ((m = regex.exec(content)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
          regex.lastIndex++
        }
        allContractAddress.add(m[0].toLowerCase())
      }
    }
    const contractAddressGroup = _.chunk(Array.from(allContractAddress), 5)
    if (contractAddressGroup.length > 0) {
      for (let i = 0, l = contractAddressGroup.length; i < l; i++) {
        const contractAddress = contractAddressGroup[i]
        // console.log('allContractAddress', contractAddress)
        let response = await fetch(
          `https://api.bscscan.com/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress.join(',')}&apikey=QY72EPJVK99S1WHIE5QHCCSEBTX2NFWJT3`
        )
        if (response.ok) {
          const data: any = await response.json()
          if (data.status === '1') {
            data.result.forEach((item: any) => {
              if (
                item.contractCreator.toLowerCase() !==
                '0x0cdb34e6a4d635142bb92fe403d38f636bbb77b8'.toLowerCase()
              ) {
                console.log(
                  `BSC\thttps://bscscan.com/address/${item.contractAddress}\t${item.contractCreator}`
                )
              }
            })
          }
        }
        response = await fetch(
          `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress.join(',')}&apikey=2GSHW7BZXKR9EDV8GW5PF59F9DVCNHETFS`
        )
        if (response.ok) {
          const data: any = await response.json()
          if (data.status === '1') {
            data.result.forEach((item: any) => {
              if (
                item.contractCreator.toLowerCase() !==
                '0x0cdb34e6a4d635142bb92fe403d38f636bbb77b8'.toLowerCase()
              ) {
                console.log(
                  `ETH\thttps://etherscan.com/address/${item.contractAddress}\t${item.contractCreator}`
                )
              }
            })
          }
        }

        response = await fetch(
          `https://api-optimistic.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress.join(',')}&apikey=5WFY5FU9EHZUA6BITY65YBI1G6HJC8FDD7`
        )
        if (response.ok) {
          const data: any = await response.json()
          if (data.status === '1') {
            data.result.forEach((item: any) => {
              if (
                item.contractCreator.toLowerCase() !==
                '0x0cdb34e6a4d635142bb92fe403d38f636bbb77b8'.toLowerCase()
              ) {
                console.log(
                  `OPT\thttps://optimistic.etherscan.io//address/${item.contractAddress}\t${item.contractCreator}`
                )
              }
            })
          }
        }
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
