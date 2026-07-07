const express = require("express");
const router = express.Router();

const {
  getBuyers,
} = require("../controllers/buyersController");

router.get("/", getBuyers);

module.exports = router;