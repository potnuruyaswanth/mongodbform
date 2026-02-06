const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user;
    next();
  });
}

module.exports = authenticate;
