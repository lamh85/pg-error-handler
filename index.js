import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const toQueryLines = (query, params) => {
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

const printErrorLocation = ({
  queryLines,
  errorLineIndex,
  karatLeftOffset
}) => {
  const lineIndexBeforeError = errorLineIndex - 1
  const lineIndexAfterError = errorLineIndex + 1

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

  printErrorLocation({
    queryLines,
    errorLineIndex,
    karatLeftOffset
  })
}

// run this in Node (or REPL) console ----
const runInConsole = () => {
  const query = `SELECT FROM (
    SELECT 5, AS number, $1 AS second, $2 AS third
  );`

  const params = [1, 'foo']

  let error

  pool.query(query, params).catch(x => error = x)

  handleError({ query, params, error })
}

const commandArgs = yargs(hideBin(process.argv)).argv
console.log(commandArgs)