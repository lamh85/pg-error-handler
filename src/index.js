// import yargs from 'yargs'
// import { hideBin } from 'yargs/helpers'

import { pool } from './database_connection.js'

const toQueryLines = ({ query, params }) => {
  let transpiled = query

  params.forEach((param, index) => {
    const paramNumber = index + 1
    const paramPattern = new RegExp('\\$' + paramNumber, 'g')
    transpiled = transpiled.replace(paramPattern, param)
  })

  return transpiled.split(/\r?\n/g)
}

const getKaratPosition = ({ queryLines, error}) => {
  const errObjPosition = parseInt(error.position)
  let charactersPassed = 0
  let linesPassed = 0
  while (charactersPassed < errObjPosition) {
    const currentLineIndex = linesPassed
    const currentLine = queryLines[currentLineIndex]

    // add 1 to represent a line break
    const lineLength = currentLine.length + 1

    charactersPassed += lineLength
    linesPassed += 1
  }

  const errorLine = linesPassed
  const errorLineIndex = errorLine - 1
  const charLengthBeforeErrorLine = queryLines
    .slice(0, errorLineIndex)
    // add 1 to represent a line break
    .reduce(
      ((accum, line) => accum + line.length + 1),
      0
    )
  const karatLeftOffset = errObjPosition - charLengthBeforeErrorLine

  return {
    karatLeftOffset,
    errorLineIndex
  }
}

const printError = ({
  queryLines,
  errorLineIndex,
  karatLeftOffset,
  error
}) => {
  const lineIndexBeforeError = errorLineIndex - 1
  const lineIndexAfterError = errorLineIndex + 1

  const heading = [
    error.message,
    `Query lines ${lineIndexBeforeError + 1} to ${lineIndexAfterError + 1}:`,
    '---'
  ]
  
  heading.forEach(line => console.log(line))

  queryLines.forEach((line, index) => {
    if (
      [lineIndexBeforeError, errorLineIndex, lineIndexAfterError].includes(index)
    ) {
      console.log(line)
    }

    if (index === errorLineIndex) {
      console.log('^'.padStart(karatLeftOffset, ' '))
    }
  })
}

const handleError = ({
  query,
  params,
  error
}) => {
  const queryLines = toQueryLines({ query, params })

  const {
    karatLeftOffset,
    errorLineIndex
  } = getKaratPosition({ queryLines, params, error })

  printError({
    queryLines,
    errorLineIndex,
    karatLeftOffset,
    error
  })
}

// run this in Node (or REPL) console ----
const runQA = async () => {
  const query = `
    SELECT * FROM (
      SELECT 5 AS number, $1 AS second, $2 AS third
      UNION
      SELECT 5 AS number, 4 AS second
    ) sub_query;
  `

  const params = [1, 'foo']

  try {
    await pool.query(query, params)
  } catch(error) {
    handleError({ query, params, error })
  }
}

runQA()

// const commandArgs = yargs(hideBin(process.argv)).argv
// console.log(commandArgs)