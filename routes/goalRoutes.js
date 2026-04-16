const express = require("express");
const router = express.Router();

const {
  createGoal,
  fetchGoals,
  addProgress,
  fetchProgress,
  updateGoal,
  fetchGoalById,
  deleteGoal,
} = require("../controllers/goalController");
const upload = require("../middleware/upload");

router.post("/create_goal", upload.single("file"), createGoal);
router.get("/fetch_goals", fetchGoals);
router.post("/add_progress", addProgress);
router.get("/fetch_progress/:goal_id", fetchProgress);
router.post("/update_goal/:id", upload.single("file"), updateGoal);
router.get("/fetch_goal/:id", fetchGoalById);
router.delete("/delete_goal/:id", deleteGoal);

module.exports = router;
