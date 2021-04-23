// import yargs from 'yargs'
// import { hideBin } from 'yargs/helpers'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { pool } from './database_connection.js'

const PRINT_CONFIG = {
  linesBeforeError: 2,
  linesAfterError: 2
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

const getErrorLocation = ({ transpiledQuery, error }) => {
  const leftBoundariesByLine = []

  transpiledQuery.split('').forEach((character, index) => {
    if (character !== '\n') return

    const position = index + 1
    leftBoundariesByLine.push(position)
  })

  let errorLineIndex = null
  const errorPosition = error.position
  leftBoundariesByLine.forEach((position, index) => {
    if (errorLineIndex !== null) return

    if (index === (leftBoundariesByLine.length - 1)) {
      errorLineIndex = index
      return
    }

    const currentLinePosition = position
    const nextLineLeftBoundary = leftBoundariesByLine[index + 1]


    if (errorPosition >= currentLinePosition && errorPosition <= nextLineLeftBoundary) {
      errorLineIndex = index
    }
  })

  const errorLinePosition = leftBoundariesByLine[errorLineIndex]
  const karatLeftOffset = errorPosition - errorLinePosition

  return { errorLineIndex, karatLeftOffset, leftBoundariesByLine }
}

const printError = ({
  transpiledQuery,
  leftBoundariesByLine,
  errorLineIndex,
  karatLeftOffset,
  error
}) => {
  const karatLine = '^'.padStart(karatLeftOffset, ' ')

  const lineIndexAfterError = errorLineIndex + 1
  const errorLineRightBoundary = leftBoundariesByLine[lineIndexAfterError] - 1

  const firstPrintLineIndex = Math.max(
    0,
    errorLineIndex - PRINT_CONFIG.linesBeforeError
  )

  const firstPrintLineLeftBoundary = leftBoundariesByLine[firstPrintLineIndex]

  const lastPrintLineIndex = Math.min(
    leftBoundariesByLine.length - 1,
    errorLineIndex + PRINT_CONFIG.linesAfterError
  )

  let lastPrintLineRightBoundary = transpiledQuery.length
  if (lastPrintLineIndex < leftBoundariesByLine.length - 1) {
    lastPrintLineRightBoundary = leftBoundariesByLine[lastPrintLineIndex + 1] - 1
  }

  const querySectionToPrint = transpiledQuery
    .split('')
    .map((character, index) => {
      const position = index + 1

      if (position < firstPrintLineLeftBoundary || position > lastPrintLineRightBoundary) {
        return
      }

      if (position === errorLineRightBoundary) {
        return character + '\n' + karatLine
      } else {
        return character
      }
    })
    .join('')

  console.log('Message from the `error` object: ', error.message)
  console.log(`Query location of the error (lines ${firstPrintLineIndex + 1} to ${lastPrintLineIndex + 1}):`)
  console.log('---')
  console.log(querySectionToPrint)
}

const writeToFile = transpiledQuery => {
  const timeStamp = +(new Date())

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const savePath = path.join(__dirname, `/../queries/${timeStamp}.sql`)

  fs.appendFile(savePath, transpiledQuery, error => {
    if (error) {
      console.log('There was a problem with logging the query:')
      console.log(error)
      return
    }

    console.log('Query is logged: ', savePath)
  })
}

const handleError = ({
  query,
  params,
  error
}) => {
  const transpiledQuery = toTranspiledQuery({ query, params })

  const {
    karatLeftOffset,
    errorLineIndex,
    leftBoundariesByLine
  } = getErrorLocation({ transpiledQuery, error })

  printError({
    transpiledQuery,
    leftBoundariesByLine,
    errorLineIndex,
    karatLeftOffset,
    error
  })

  writeToFile(transpiledQuery)
}

// run this in Node (or REPL) console ----
const runQA = async () => {
  const query = `
    SELECT *
    FROM (
      SELECT 5 AS number, $1 AS second, $2 AS third
      UNION
      SELECT 5 AS number, 4 AS second, 'foo' AS third
    ) sub_query
    LEFT JOIN, (
      SELECT * FROM UNNEST(ARRAY[1,2,3])
    );
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