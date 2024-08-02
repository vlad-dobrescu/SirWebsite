import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getAuth, setPersistence, createUserWithEmailAndPassword, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js";
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

console.log("Firebase initialized");

// Set authentication persistence
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Persistence set");
    // Attach event listener to the form
    document.getElementById("signUP-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      console.log("Form submission prevented");
      const login = event.target.login.value;
      const password = event.target.password.value;
      console.log("Login:", login);
      console.log("Password:", password);

      try {
        const { user } = await createUserWithEmailAndPassword(auth, login, password);
        console.log("User created:", user);
        const idToken = await user.getIdToken();
        console.log("ID Token:", idToken);

        await fetch("/sessionLogin", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "CSRF-Token": Cookies.get("XSRF-TOKEN"),
          },
          body: JSON.stringify({ idToken }),
        });

        await auth.signOut();
        window.location.assign("/contul-meu");
      } catch (error) {
        console.error("Error during sign up:", error);
      }

      return false;
    });
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });
