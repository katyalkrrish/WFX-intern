const express = require("express");
const router = express.Router();

const {
  getOrders,
} = require("../controllers/ordersController");

router.get("/", getOrders);

module.exports = router;