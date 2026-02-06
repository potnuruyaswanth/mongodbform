const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../utils/tokens");

const router = express.Router();

/* LOGIN */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM registration WHERE username=?",
    [username],
    async (err, result) => {
      if (result.length === 0) return res.sendStatus(401);

      const user = result[0];
      const match = await bcrypt.compare(password, user.hashedpassword);
      if (!match) return res.sendStatus(401);

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      db.query(
        "INSERT INTO refresh_tokens (user_id, token) VALUES (?,?)",
        [user.id, refreshToken]
      );

      res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 15 * 60 * 1000
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000
        })
        .json({ message: "Login success" });
    }
  );
});

/* REFRESH */
router.post("/refresh", (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.sendStatus(401);

  db.query(
    "SELECT * FROM refresh_tokens WHERE token=?",
    [token],
    (err, result) => {
      if (result.length === 0) return res.sendStatus(403);

      jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);

        const newAccessToken = generateAccessToken(user);

        res.cookie("access_token", newAccessToken, {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 15 * 60 * 1000
        });

        res.json({ message: "refreshed" });
      });
    }
  );
});

/* LOGOUT */
router.post("/logout", (req, res) => {
  const token = req.cookies.refresh_token;
  db.query("DELETE FROM refresh_tokens WHERE token=?", [token]);

  res
    .clearCookie("access_token")
    .clearCookie("refresh_token")
    .json({ message: "logged out" });
});

module.exports = router;
