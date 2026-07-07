const express = require("express");

const router = express.Router();

const {
  getInvoices,
} = require("../controllers/invoicesController");

router.get("/", getInvoices);

module.exports = router;