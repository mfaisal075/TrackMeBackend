const db = require("../config/db");

// CREATE GOAL
exports.createGoal = (req, res) => {
  const {
    category,
    sub_category,
    title,
    frequency,
    start_date,
    end_date,
    note,
    status,
  } = req.body;

  const file = req.file ? req.file.filename : null;

  // Basic validation
  if (!title) {
    return res.status(400).json({
      Status: 400,
      message: "Title is required",
    });
  }

  const query = `
    INSERT INTO tbl_goals (
      category, \`sub_category\`, title, frequency, start_date, end_date, note, file, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    category || null,
    sub_category || null,
    title,
    frequency || null,
    start_date || null,
    end_date || null,
    note || null,
    file,
    status || 'Pending',
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error creating goal:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while creating goal",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Goal created successfully",
      data: {
        id: result.insertId,
        title,
        category,
      },
    });
  });
};

// FETCH GOALS
exports.fetchGoals = (req, res) => {
  const query = `
    SELECT 
      g.*, 
      (SELECT COUNT(*) FROM tbl_goal_details WHERE goal_id = g.id AND (goal_status = 'done' OR goal_status = 'Completed' OR goal_status = g.status)) AS completed_days 
    FROM tbl_goals g 
    ORDER BY g.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching goals:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while fetching goals",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Goals fetched successfully",
      data: results,
    });
  });
};

exports.addProgress = (req, res) => {
  const { goal_id, date, goal_status, streak } = req.body;

  // Basic validation
  if (!goal_id) {
    return res.status(400).json({
      Status: 400,
      message: "goal_id is required",
    });
  }

  const checkQuery = "SELECT id FROM tbl_goal_details WHERE goal_id = ? AND date = ?";
  db.query(checkQuery, [goal_id, date], (err, existsResult) => {
    if (err) {
      console.error("Error checking progress:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while checking progress",
      });
    }

    if (existsResult.length > 0) {
      return res.status(200).json({
        status: 200,
        message: "Goal already marked for today",
        data: existsResult[0],
      });
    }

    db.query("SELECT start_date, end_date, status FROM tbl_goals WHERE id = ?", [goal_id], (err, goalResult) => {
      if (err || goalResult.length === 0) {
        console.error("Error fetching goal info:", err);
        return res.status(500).json({
          Status: 500,
          message: "Goal not found",
        });
      }

      const { start_date, end_date, status: currentStatus } = goalResult[0];
      
      const insertQuery = `
        INSERT INTO tbl_goal_details (
          goal_id, \`date\`, goal_status, created_at, updated_at
        ) VALUES (?, ?, ?, NOW(), NOW())
      `;

      db.query(insertQuery, [goal_id, date || null, goal_status || "done"], (err, result) => {
        if (err) {
          console.error("Error adding progress:", err);
          return res.status(500).json({
            Status: 500,
            message: "Server error while adding progress",
          });
        }

        // Now handle goal status updates
        db.query("SELECT COUNT(*) as count FROM tbl_goal_details WHERE goal_id = ?", [goal_id], (err, countResult) => {
          if (err) {
            console.error("Error counting progress:", err);
            // Non-critical error for the user response, but good to know
          }

          const progressCount = countResult[0].count;
          let newStatus = currentStatus;

          // 1. If first progress, change Pending to In Progress
          if (progressCount >= 1 && currentStatus === 'Pending') {
            newStatus = 'In Progress';
          }

          // 2. Check for end date completion
          const isAtOrAfterEndDate = end_date && (date >= end_date);
          
          if (isAtOrAfterEndDate) {
            // Calculate total expected days
            const start = new Date(start_date);
            const end = new Date(end_date);
            const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            
            // If total progress entries equal or exceed total days (assuming 1 per day), mark Completed
            // Else, mark Not Completed
            if (progressCount >= totalDays) {
              newStatus = 'Completed';
            } else {
              newStatus = 'Not Completed';
            }
          }

          // Update goal status if it changed
          if (newStatus !== currentStatus) {
            db.query("UPDATE tbl_goals SET status = ? WHERE id = ?", [newStatus, goal_id]);
          }

          res.status(200).json({
            status: 200,
            message: isAtOrAfterEndDate && newStatus === 'Completed' ? "Goal completed!" : "Progress added successfully",
            data: {
              id: result.insertId,
              goal_id,
              date,
              goal_status: goal_status || "done",
              new_goal_status: newStatus
            },
          });
        });
      });
    });
  });
};

exports.fetchProgress = (req, res) => {
  const { goal_id } = req.params;

  if (!goal_id) {
    return res.status(400).json({
      Status: 400,
      message: "goal_id is required",
    });
  }

  const query = "SELECT * FROM tbl_goal_details WHERE goal_id = ? ORDER BY date DESC, id DESC";

  db.query(query, [goal_id], (err, results) => {
    if (err) {
      console.error("Error fetching progress:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while fetching progress",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Progress fetched successfully",
      data: results,
    });
  });
};

exports.updateGoal = (req, res) => {
  const { id } = req.params;
  const {
    category,
    sub_category,
    title,
    frequency,
    start_date,
    end_date,
    note,
    status,
  } = req.body;
  const file = req.file ? req.file.filename : null;

  // Build dynamic update query
  let query = "UPDATE tbl_goals SET ";
  let values = [];
  let updates = [];

  if (category) {
    updates.push("category = ?");
    values.push(category);
  }
  if (sub_category) {
    updates.push("`sub_category` = ?");
    values.push(sub_category);
  }
  if (title) {
    updates.push("title = ?");
    values.push(title);
  }
  if (frequency) {
    updates.push("frequency = ?");
    values.push(frequency);
  }
  if (start_date) {
    updates.push("start_date = ?");
    values.push(start_date);
  }
  if (end_date) {
    updates.push("end_date = ?");
    values.push(end_date);
  }
  if (note) {
    updates.push("note = ?");
    values.push(note);
  }
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }
  if (file) {
    updates.push("file = ?");
    values.push(file);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "No fields provided to update",
    });
  }

  query += updates.join(", ") + " WHERE id = ?";
  values.push(id);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error updating goal:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while updating goal",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: 404,
        message: "Goal not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Goal updated successfully",
    });
  });
};

exports.fetchGoalById = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      Status: 400,
      message: "Goal ID is required",
    });
  }

  const query = `
    SELECT 
      g.*, 
      (SELECT COUNT(*) FROM tbl_goal_details WHERE goal_id = g.id AND (goal_status = 'done' OR goal_status = 'Completed' OR goal_status = g.status)) AS completed_days 
    FROM tbl_goals g 
    WHERE g.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching goal:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while fetching goal",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        Status: 404,
        message: "Goal not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "Goal fetched successfully",
      data: results[0],
    });
  });
};

exports.deleteGoal = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      Status: 400,
      message: "Goal ID is required",
    });
  }

  // Delete goal details first (foreign key constraint)
  db.query("DELETE FROM tbl_goal_details WHERE goal_id = ?", [id], (err) => {
    if (err) {
      console.error("Error deleting goal details:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while deleting goal history",
      });
    }

    // Delete the goal itself
    db.query("DELETE FROM tbl_goals WHERE id = ?", [id], (err, result) => {
      if (err) {
        console.error("Error deleting goal:", err);
        return res.status(500).json({
          Status: 500,
          message: "Server error while deleting goal",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          Status: 404,
          message: "Goal not found",
        });
      }

      res.status(200).json({
        status: 200,
        message: "Goal deleted successfully",
      });
    });
  });
};
