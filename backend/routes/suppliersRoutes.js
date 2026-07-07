const express = require("express");

const router = express.Router();

const {
  getSuppliers,
} = require("../controllers/suppliersController");

router.get("/", getSuppliers);

module.exports = router;