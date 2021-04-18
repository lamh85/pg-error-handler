// Examples of bad query:

const queryBad = 'select count(*), from funds;'

const queryBad2 = `SELECT FROM (
  SELECT 5, AS number
);` // Error at position 27
// Repl console evaluates the variable assignment to this:
'SELECT FROM (\n  SELECT 5, AS number\n);'

const queryBad3 = `SELECT FROM (
something
)
` // Error at position 25

result = pool.query(queryBad2).catch(x => errorObj = x)

// Example error object:
const errorObj = { name: "error", length: 93, severity: "ERROR", code: "42601", position: "18", file: "scan.l", line: "1149", routine: "scanner_yyerror" }
// The error object is a subclass of the standard Error class:
// https://stackoverflow.com/a/30295921
//   > errorObj.message
// 'syntax error at or near "from"'


// line 1 has 12 characters
SELECT FROM(
  SELECT 5, AS number
);

SELECT FROM (\nsomething\n)\n

// line 1 has 13 characters
SELECT FROM (
something
)