const express = require("express");
const router = express.Router();
const { askQuestion, imageSearch } = require("../controllers/aiController");

router.post("/query", askQuestion);
router.post("/image-search", imageSearch);

module.exports = router;