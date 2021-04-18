const transpileQuery = (query, params) => {
  let transpiled = query

  params.forEach((param, index) => {
    const paramNumber = index + 1
    const paramPattern = new RegExp('\\$' + paramNumber, 'g')
    transpiled = transpiled.replace(paramPattern, param)
  })

  return transpiled
}

const handleError = ({
  query,
  params,
  error
}) => {
  const queryTranspiled = transpileQuery(query, params)

  const queryLines = queryTranspiled.split(/\r?\n/g)

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
  const charNumAtErrorLine = errObjPosition - charLengthBeforeErrorLine

  const errorLineIndex = errorLine - 1

  const lineIndexBeforeError = errorLineIndex - 1
  if (lineIndexBeforeError >= 0) {
    console.log(queryLines[lineIndexBeforeError])
  }
  console.log(queryLines[errorLineIndex])
  console.log('^'.padStart(charNumAtErrorLine, ' '))
  const lineIndexAfterError = errorLineIndex + 1
  if (lineIndexAfterError <= queryLines.length - 1) {
    console.log()
  }
}

const query = `SELECT FROM (
  SELECT 5, AS number, $1 AS second, $2 AS third
);`

const params = [1, 'foo']