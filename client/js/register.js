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
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(response => {
        if (!response.ok) {
          alert("Error: " + response.json().error);
        }
        else {
          return response.text();
        }
      })
      .then(data => {
        fetch(api + '/auth/verify', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(response => response.json())
          .then(data => {
            const { user } = data;
            if (data.error) {
              alert(data.error);
              return;
            }
            if (user.role == "admin") {
              window.location.href = "signedinAdmin.html"; // Redirect to admin page
            } else {
              window.location.href = "signedinUser.html"; // Redirect to profile page
            }
          }
          )
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