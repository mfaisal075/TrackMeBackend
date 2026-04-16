const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// LOGIN
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (password.length < 6) {
    return res.status(400).json({
      Status: 400,
      message: "Password must be at least 6 characters long",
    });
  }

  const query = "SELECT * FROM tbl_users WHERE email = ?";

  db.query(query, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ Status: 500, message: "Server error" });
    }

    if (results.length === 0) {
      return res
        .status(400)
        .json({ Status: 400, message: "User not found" });
    }

    const user = results[0];

    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ Status: 400, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const baseUrl = `${req.protocol}://${req.get("host")}/assets/`;

    res.json({
      Status: 200,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        profile_pic: user.profile_pic ? baseUrl + user.profile_pic : null,
      },
    });
  });
};

// FETCH PROFILE
exports.getProfile = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      Status: 400,
      message: "User ID is required",
    });
  }

  const query = "SELECT * FROM tbl_users WHERE id = ?";

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error fetching profile:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while fetching profile",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        Status: 404,
        message: "User not found",
      });
    }

    const user = results[0];
    delete user.password;

    const baseUrl = `${req.protocol}://${req.get("host")}/assets/`;
    if (user.profile_pic) {
      user.profile_pic = baseUrl + user.profile_pic;
    }

    res.status(200).json({
      Status: 200,
      message: "Profile fetched successfully",
      data: user,
    });
  });
};

// UPDATE PROFILE
exports.updateProfile = (req, res) => {
  const { id } = req.params;
  const { name, email, status } = req.body;
  const profile_pic = req.file ? req.file.filename : null;

  if (!id) {
    return res.status(400).json({
      Status: 400,
      message: "User ID is required",
    });
  }

  // Build dynamic update query
  let query = "UPDATE tbl_users SET ";
  let values = [];
  let updates = [];

  if (name) {
    updates.push("name = ?");
    values.push(name);
  }
  if (email) {
    updates.push("email = ?");
    values.push(email);
  }
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }
  if (profile_pic) {
    updates.push("profile_pic = ?");
    values.push(profile_pic);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      Status: 400,
      message: "No fields provided to update",
    });
  }

  query += updates.join(", ") + " WHERE id = ?";
  values.push(id);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error updating profile:", err);
      return res.status(500).json({
        Status: 500,
        message: "Server error while updating profile",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        Status: 404,
        message: "User not found",
      });
    }

    res.status(200).json({
      Status: 200,
      message: "Profile updated successfully",
    });
  });
};

// UPDATE PASSWORD
exports.updatePassword = (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!id || !currentPassword || !newPassword) {
    return res.status(400).json({
      Status: 400,
      message: "All fields are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      Status: 400,
      message: "New password must be at least 6 characters long",
    });
  }

  // 1. Fetch user to get current password hash
  const query = "SELECT password FROM tbl_users WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ Status: 500, message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ Status: 404, message: "User not found" });
    }

    const user = results[0];

    // 2. Verify current password
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ Status: 400, message: "Incorrect current password" });
    }

    // 3. Hash new password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);

    // 4. Update password
    const updateQuery = "UPDATE tbl_users SET password = ? WHERE id = ?";
    db.query(updateQuery, [hashedPassword, id], (err, result) => {
      if (err) {
        return res.status(500).json({ Status: 500, message: "Server error while updating password" });
      }

      res.status(200).json({
        Status: 200,
        message: "Password updated successfully",
      });
    });
  });
};
