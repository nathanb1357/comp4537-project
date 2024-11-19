import { api } from './const.js';


document.addEventListener("DOMContentLoaded", function () {

  const loginFormContainer = document.getElementById("loginFormContainer");
  const signupFormContainer = document.getElementById("signupFormContainer");
  const showSignupForm = document.getElementById("showSignupForm");
  const showLoginForm = document.getElementById("showLoginForm");

  // Toggle to show signup form
  showSignupForm.addEventListener("click", function (event) {
    event.preventDefault();
    loginFormContainer.classList.add("d-none");
    signupFormContainer.classList.remove("d-none");
  });

  // Toggle to show login form
  showLoginForm.addEventListener("click", function (event) {
    event.preventDefault();
    signupFormContainer.classList.add("d-none");
    loginFormContainer.classList.remove("d-none");
  });

  // Handle Login Form Submission
  document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    fetch(api + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem("userToken", data.token); // Store the token

          fetch(api + '/auth/userInfo/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + data.token
            }
          }).then(response => response.json())
            .then(data => {
              if (data.user_role == "admin") {
                window.location.href = "signedinAdmin.html"; // Redirect to admin page
              } else {
                window.location.href = "signedinUser.html"; // Redirect to profile page
              }
            }
            )
        } else {
          alert("Login failed: " + data.error);
        }
      })
      .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      });
  });

  // Handle Signup Form Submission
  document.getElementById("signupForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    fetch(api + '/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(response => response.text())
      .then(data => {
        alert(data);
      })
      .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      });
  });
});