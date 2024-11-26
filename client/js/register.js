import { api } from './const.js';
import { userMessages } from '../lang/en.js';

class AuthApp {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.setupFormToggle();
      this.setupFormHandlers();
    });
  }

  setupFormToggle() {
    const loginFormContainer = document.getElementById("loginFormContainer");
    const signupFormContainer = document.getElementById("signupFormContainer");
    const showSignupForm = document.getElementById("showSignupForm");
    const showLoginForm = document.getElementById("showLoginForm");

    // Toggle to show signup form
    showSignupForm.addEventListener("click", (event) => {
      event.preventDefault();
      loginFormContainer.classList.add("d-none");
      signupFormContainer.classList.remove("d-none");
    });

    // Toggle to show login form
    showLoginForm.addEventListener("click", (event) => {
      event.preventDefault();
      signupFormContainer.classList.add("d-none");
      loginFormContainer.classList.remove("d-none");
    });
  }

  setupFormHandlers() {
    this.setupLoginFormHandler();
    this.setupSignupFormHandler();
  }

  async handleButtonClick(button, action) {
    button.disabled = true;
    try {
      await action();
    } catch (error) {
      console.error("Error:", error);
      alert(userMessages.error.generic);
    } finally {
      button.disabled = false;
    }
  }

  setupLoginFormHandler() {
    const loginForm = document.getElementById("loginForm");
    loginForm.addEventListener("submit", (event) => this.handleButtonClick(event.target.querySelector("button"), () => this.loginUser(event)));
  }

  async loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const loginResponse = await fetch(api + '/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        alert(userMessages.error.loginFailed + (error.error ? ` ${error.error}` : ""));
        return;
      }

      const verifyResponse = await fetch(api + '/auth/verify', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const { user } = await verifyResponse.json();

      if (user.role === "admin") {
        window.location.href = "signedinAdmin.html"; // Redirect to admin page
      } else {
        window.location.href = "signedinUser.html"; // Redirect to profile page
      }
    } catch (error) {
      console.error("Error:", error);
      alert(userMessages.error.generic);
    }
  }

  setupSignupFormHandler() {
    const signupForm = document.getElementById("signupForm");
    signupForm.addEventListener("submit", (event) => this.handleButtonClick(event.target.querySelector("button"), () => this.signupUser(event)));
  }

  async signupUser(event) {
    event.preventDefault();

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    try {
      const signupResponse = await fetch(api + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!signupResponse.ok) {
        alert(userMessages.error.signupFailed);
        return;
      }

      const data = await signupResponse.json();
      alert(userMessages.success.signup);
    } catch (error) {
      console.error("Error:", error);
      alert(userMessages.error.generic);
    }
  }
}

new AuthApp();
