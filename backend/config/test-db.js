// test-db.js

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.query("SELECT NOW()")
  .then(res => {
    console.log(res.rows);
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit();
  });