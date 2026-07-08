const express = require("express");
const router = express.Router();
const {
  getProducts,
  searchProducts,
  getProductFilters,
  getProductDetails
} = require("../controllers/productsController");

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/filters", getProductFilters);
router.get("/:styleNumber", getProductDetails);

module.exports = router;