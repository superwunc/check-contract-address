import * as core from '@actions/core'
import * as cheerio from 'cheerio'
import fs from 'node:fs'
import _ from 'lodash'
const WHITE_ADDRESS = [
  '0x5ee1f0cc33f0a9b4eb7e153a497243b09a578ce7',
  '0x970609ba2c160a1b491b90867681918bdc9773af',
  '0xf07c30e4cd6cfff525791b4b601bd345bded7f47',
  '0xecb851ab9470dc845964d63ba78cdbe5d5c08189',
  '0x88efdac29e3ba290512e26c04908692ae9810566',
  '0xfc19e4ce0e0a27b09f2011ef0512669a0f76367a',
  '0x4e656459ed25bf986eea1196bc1b00665401645d',
  '0x8e39fbba48014e8a36b36dad183d2a00e9c750cc',
  '0x2ffc59d32a524611bb891cab759112a51f9e33c0',
  '0x5c06c1022bc6e221be74196a14c9f5cf3bc187b1',
  '0x872b0974c955e1bd47d5cf6defa86887aed13ba6',
  '0x311b9e2eb0d0618b72218097eb6b5002978c7d3b',
  '0xfe84a07f252743edd868a25dcbbb8f6b424d729d',
  '0xd4fb89a009cf22246b69d17a420dfb9fcd2a4014',
  '0xc26afb02a918940760b0da79cc10ede68962500f',
  '0xaadcc13071fdf9c73cfbb8d97639ea68aa6fd1d2',
  '0x433baf6c9dab45201d53fb99b88392c0bb20db3f',
  '0x9ece4bf86534afe47f59e600bf1da64ecdb57650',
  '0xb55914f1da05d15e7976edc97b33ac4675ff1310',
  '0x39f0bd56c1439a22ee90b4972c16b7868d161981',
  '0x225c6084086f83ece4bc747403f292a7d324fd2e',
  '0xdb9f9be4d6a033d622f6785ba6f8c3680dec2452',
  '0x7759124915160e94c77ece5b96e8a7fcec44aa19',
  '0xd09971d8ed6c6a5e57581e90d593ee5b94e348d4',
  '0x48733ddd686d726a49f20a3e4cda9d9c9e2276ae',
  '0x36469e4e6ec2fb3e06db1d747f3fc1f1fc762f02',
  '0xa7551abe0a066555cb5d859849426fb55543ca25'
].map(item => item.toLowerCase())
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

async function fetchBscScanTag(address: string) {
  try {
    const reponse = await fetch(`https://bscscan.com/address/${address}`)
    if (reponse.ok) {
      const text = await reponse.text()
      const $ = cheerio.load(text)
      const tags = $('#ContentPlaceHolder1_divLabels .hash-tag').text()
      console.log('tags', tags)
      return tags
    }
  } catch (error) {
    return []
  }
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
        if (!WHITE_ADDRESS.includes(m[0].toLowerCase())) {
          allContractAddress.add(m[0].toLowerCase())
        }
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
            data.result.forEach(async (item: any) => {
              if (!DeployList.includes(item.contractCreator.toLowerCase())) {
                console.log(
                  `BSC\thttps://bscscan.com/address/${item.contractAddress}\t${item.contractCreator}`
                )
                await fetchBscScanTag(item.contractAddress)
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
