const authenticate = require("./middleware/authMiddleware");

app.get("/dashboard", authenticate, (req, res) => {
  res.json({ message: "Welcome", user: req.user });
});
