var admin = require("firebase-admin");

var serviceAccount = require("../secret/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin; 