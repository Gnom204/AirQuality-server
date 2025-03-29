const User = require("../models/User");

exports.makeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "admin" },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User promoted to admin", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
