const express = require("express");
const router = express.Router();
const { login, getProfile, updateProfile, updatePassword, signup } = require("../controllers/authController");
const upload = require("../middleware/upload");

router.post("/userlogin", login);
router.post("/signup", signup);
router.get("/fetch_profile/:id", getProfile);
router.post("/update_profile/:id", upload.single("profile_pic"), updateProfile);
router.post("/update_password/:id", updatePassword);

module.exports = router;
