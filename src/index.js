// import yargs from 'yargs'
// import { hideBin } from 'yargs/helpers'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { pool } from './database_connection.js'

const PRINTED_ROWS_MAX = {
  BEFORE: 2,
  AFTER: 2
}

const toTranspiledQuery = ({ query, params }) => {
  let transpiled = query

  params.forEach((param, index) => {
    const paramNumber = index + 1
    const paramPattern = new RegExp('\\$' + paramNumber, 'g')
    transpiled = transpiled.replace(paramPattern, param)
  })

  return transpiled
}

const getLeftPositions = ({ transpiledQuery, errorPosition }) => {
  const newLinePositions = [1]

  const queryCharacters = transpiledQuery.split('')

  queryCharacters.forEach((character, index) => {
    if (character === '\n') {
      newLinePositions.push(index + 1)
    }
  })

  let errorLeftPosition = null

  newLinePositions.forEach((position, index) => {
    if (errorLeftPosition !== null) return

    if (index === newLinePositions.length - 1) {
      errorLeftPosition = position
    }

    if (errorPosition >= position && errorPosition < newLinePositions[index + 1]) {
      errorLeftPosition = position
    }
  })

  return { errorLeftPosition, newLinePositions }
}

const getKaratLine = ({ newLinePositions, errorLeftPosition, errorPosition }) => {
  let karatLeftOffset = 0
  if (!newLinePositions.includes(errorPosition)) {
    karatLeftOffset = errorPosition - errorLeftPosition
  }

  return '▲'.padStart(karatLeftOffset, ' ')
}

const getPrintedQuery = ({ transpiledQuery, newLinePositions, karatLine, errorLeftPosition }) => {
  const errorLineIndex = newLinePositions.indexOf(errorLeftPosition)

  const printPositions = {
    first: null,
    errorLineRight: transpiledQuery.length,
    last: transpiledQuery.length
  }

  let firstLineIndex = errorLineIndex - PRINTED_ROWS_MAX.BEFORE
  if (firstLineIndex < 0) {
    firstLineIndex = 0
  }

  printPositions.first = newLinePositions[firstLineIndex]

  const leftAfterError = newLinePositions[errorLineIndex + 1]
  if (leftAfterError) {
    printPositions.errorLineRight = leftAfterError - 1
  }

  let lastLineIndex = errorLineIndex + PRINTED_ROWS_MAX.AFTER
  if (lastLineIndex >= newLinePositions.length) {
    lastLineIndex = newLinePositions.length - 1
  }

  let leftPositionAfterLastLine = newLinePositions[lastLineIndex + 1]

  if (leftPositionAfterLastLine) {
    printPositions.last = leftPositionAfterLastLine - 1
  }

  const printedQuery = transpiledQuery.split('').map((character, index) => {
    const position = index + 1

    if (position < printPositions.first || position > printPositions.last) {
      return ''
    }

    if (position == printPositions.errorLineRight) {
      return character + '\n' + karatLine
    } else {
      return character
    }
  }).join('')

  return {
    printedQuery,
    firstLineNumber: firstLineIndex + 1,
    lastLineNumber: lastLineIndex + 1
  }
}

const printError = ({ printedQuery, errorMessage, firstLineNumber, lastLineNumber }) => {
  const printedLines = [
    `Postgres error: ${errorMessage}`,
    `Source of error: lines ${firstLineNumber} to ${lastLineNumber}:`,
    '---',
    printedQuery,
    '---'
  ]

  printedLines.forEach(line => {
    console.log(line)
  })
}

const writeToFile = transpiledQuery => {
  const timeStamp = +(new Date())

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const absoluteDir = path.join(__dirname, '/../logged_queries')

  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir)
  }

  const filePath = path.join(absoluteDir, `/${timeStamp}.sql`)

  fs.appendFile(filePath, transpiledQuery, error => {
    if (error) {
      console.log('There was a problem with logging the query:')
      console.log(error)
      return
    }

    console.log('Query is logged: ', filePath)
  })
}

const handleError = ({
  query,
  params,
  error
}) => {
  const transpiledQuery = toTranspiledQuery({ query, params })

  const errorPosition = error.position

  const { errorLeftPosition, newLinePositions } = getLeftPositions({
    transpiledQuery,
    errorPosition
  })

  const karatLine = getKaratLine({
    newLinePositions,
    errorLeftPosition,
    errorPosition
  })

  const {
    printedQuery,
    firstLineNumber,
    lastLineNumber
  } = getPrintedQuery({
    transpiledQuery,
    newLinePositions,
    karatLine,
    errorLeftPosition
  })

  printError({
    printedQuery,
    errorMessage: error.message,
    firstLineNumber,
    lastLineNumber
  })

  // writeToFile(transpiledQuery)
}

// run this in Node (or REPL) console ----
const runQA = async () => {
  const query = `SELECT, *
    FROM (
      SELECT 5 AS number, $1 AS second, $2 AS third
      UNION
      SELECT 5 AS number, 4 AS second, 'foo' AS third
    ) sub_query
    LEFT JOIN (
      SELECT * FROM UNNEST(ARRAY[1,2,3])
    ) some_set ON TRUE;`

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