import * as core from '@actions/core'

import fs from 'node:fs'
import _ from 'lodash'

const PendleDeployer = [
  '0x59aad2C81b86df6E4A0Dae51c5C5bd45Ba451875',
  '0x1FcCC097db89A86Bfc474A1028F93958295b1Fb7',
  '0xC107DAcAf1d6e369CFDc67695BEAdf5e2068191e',
  '0x196e6d50df6289e1F82838E84774b2B0c8f4aF62'
]
const MagpieDeployer = ['0x0cdb34e6a4d635142bb92fe403d38f636bbb77b8']
const WombatDeployer = [
  '0x8c6644415b3F3CD7FC0A453c5bE3d3306Fe0b2F9',
  '0xcB3Bb767104e0b3235520fafB182e005D7efD045'
]

const DeployList = PendleDeployer.concat(MagpieDeployer)
  .concat(WombatDeployer)
  .map(item => item.toLowerCase())
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
              if (!DeployList.includes(item.contractCreator.toLowerCase())) {
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
              if (!DeployList.includes(item.contractCreator.toLowerCase())) {
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
              if (!DeployList.includes(item.contractCreator.toLowerCase())) {
                console.log(
                  `OPT\thttps://optimistic.etherscan.io/address/${item.contractAddress}\t${item.contractCreator}`
                )
              }
            })
          }
        }
        response = await fetch(
          `https://api.arbiscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress.join(',')}&apikey=GW3162V3DQ8IDU5XZYM28QK79W2K16CUYB`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.status === '1') {
            data.result.forEach((item: any) => {
              if (!DeployList.includes(item.contractCreator.toLowerCase())) {
                console.log(
                  `ARB\thttps://arbiscan.io/address/${item.contractAddress}\t${item.contractCreator}`
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
