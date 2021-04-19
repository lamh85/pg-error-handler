var repl = require("repl");
const { Pool } = require('pg')

require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT
})

const querySync = async (query, params, callback) => {
  pool.query(query, params)
    .then(response => {
      callback(response)
    })
    .catch(error => {
      callback(response)
    })
}

// start REPL server

var replServer = repl.start({});

// set REPL context

replServer.context.pool = pool
replServer.context.querySync = querySync