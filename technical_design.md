# Requirements

GIVEN the position number
* The position number includes "\n" has one character each
GIVEN the query
* Could be multi-line

Render the 

LAST STEP:
Print out 3 lines:
1. one line before the source of error
2. the line containing the error
   * STRETCH - place a karat beneath that character
3. one line after the source of error

# Challenges

`\n` counts as 1 character. Therefore, we can't create an array of lines. That would delete all the `\n` in the query.

However, finding the character index in a string could return `\n`:

```javascript
const query = `
   SELECT * FROM (
   SELECT 5 AS number, $1 AS second, $2 AS third
   UNION
   SELECT 5 AS number, 4 AS second
   ) sub_query;
`

query[0] // returns \n
```

# Flow

Create list of lines. Each line tells us the overall character position of that line's first character.

Example:
```
GIVEN:
'hot
dog
boat'

The list is:
[
   1,
   4,
   7
]
```