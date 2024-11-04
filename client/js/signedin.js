import { api } from './const.js';

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('resetPasswordButton').addEventListener('click', function () {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  // Retrieve and display profile data from localStorage
  const userData = localStorage.getItem("userToken");
  //check if token is still valid
  if (!userData) {
    window.location.href = "index.html";
    alert("No user data found. Please log in.");
  }

  if (userData.expiry < Date.now()) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "index.html";
  }

  fetch(api + '/auth/userInfo/', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + userData
    }
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById("profileEmail").textContent = data.user_email || "N/A";
      document.getElementById("apiUsage").textContent = data.user_calls || "N/A";
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    });
});

// Handle confirm button in modal for sending password reset email
document.getElementById("confirmSendEmail").addEventListener("click", function () {
  const email = document.getElementById("profileEmail").textContent;
  if (!email) {
    alert("User email not found.");
    return;
  }

  fetch(api + '/auth/resetPassword/' + email, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.text())
    .then(data => {
      alert(data);
      new bootstrap.Modal(document.getElementById("confirmModal")).hide();
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    });
});
