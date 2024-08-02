import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";
import Cookies from "https://cdn.jsdelivr.net/npm/js-cookie@3.0.1/dist/js.cookie.min.mjs";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz8O6N9D6OLerzAvxyVl3ateDxaCKOqdc",
  authDomain: "magazinsir.firebaseapp.com",
  projectId: "magazinsir",
  storageBucket: "magazinsir.appspot.com",
  messagingSenderId: "212675104142",
  appId: "1:212675104142:web:ac95bb1716a1feaf75e8df",
  measurementId: "G-571VVBXN8W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.getElementById("google-sign-in").addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      return user.getIdToken().then((idToken) => {
        return fetch("/sessionLogin", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "CSRF-Token": Cookies.get("XSRF-TOKEN"),
          },
          body: JSON.stringify({ idToken }),
        });
      });
    })
    .then(() => {
      window.location.assign("/");
    })
    .catch((error) => {
      console.error("Error during Google sign-in:", error);
    });
});
