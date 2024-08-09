const dotenv = require('dotenv');
dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const admin = require('../server/firebase');
const checkAuth = (req, res, next) => {
  const sessionCookie = req.cookies.session || "";
  admin.auth().verifySessionCookie(sessionCookie, true)
    .then((userData) => {
      req.isLoggedIn = true;
      req.email = userData.email;

      if (userData.email !== ADMIN_EMAIL) {
        // If the user is not the admin, deny access
        return res.status(403).send("Access Denied: You do not have permission to view this page.");
      }

      next();
    })
    .catch(() => {
      req.isLoggedIn = false;
      res.redirect('/autentificare'); // Redirect to login page if not authenticated
    });
};
module.exports = checkAuth;