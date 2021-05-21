// import yargs from 'yargs'
// import { hideBin } from 'yargs/helpers'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { pool } from './database_connection.js'

PRINTED_ROWS_MAX = {
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
  const newLinePositions = []

  const queryCharacters = transpiledQuery.split('')

  queryCharacters.forEach((character, index) => {
    if (character === '\n') {
      newLinePositions.push(index + 1)
    }
  })

  let errorLeftPosition = null

  newLinePositions.forEach((position, index) => {
    if (errorLeftPosition !== null) return

    if (errorPosition >= position && errorPosition < newLinePositions[index + 1]) {
      errorLeftPosition = position
    }
  })

  return { errorLeftPosition, newLinePositions }
}

const getKaratLine = ({ newLinePositions, errorLeftPosition, errorPosition}) => {

  // keep this ----------------------

  let karatLeftOffset = 0
  if (!newLinePositions.includes(errorPosition)) {
    karatLeftOffset = errorPosition - errorLeftPosition
  }

  return '▲'.padStart(karatLeftOffset, ' ')
}

const getPrintedQuery = ({ transpiledQuery, newLinePositions, karatLine }) => {
  const errorLineIndex = newLinePositions.indexOf(errorLeftPosition)
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

  const karatLine = getKaratLine({
    transpiledQuery,
    errorPosition
  })

  const { errorLeftPosition, newLinePositions } = getLeftPositions({
    transpiledQuery,
    errorPosition
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