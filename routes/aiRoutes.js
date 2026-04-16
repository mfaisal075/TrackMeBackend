const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/ai/suggest-goal", aiController.suggestGoal);
router.post("/ai/insight", aiController.generateInsight);

module.exports = router;
