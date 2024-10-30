import { api } from './const.js';

document.addEventListener("DOMContentLoaded", function () {
  // Retrieve and display profile data from localStorage
  const userData = JSON.parse(localStorage.getItem("userToken"));
  if (userData) {
    document.getElementById("profileUsername").textContent = userData.username || "N/A";
    document.getElementById("profileEmail").textContent = userData.email || "N/A";
    document.getElementById("profileBio").textContent = userData.bio || "N/A";
  } else {
    window.location.href = "index.html";
    alert("No user data found. Please log in.");
  }

  // Handle confirm button in modal for sending password reset email
  document.getElementById("confirmSendEmail").addEventListener("click", function () {
    const email = userData ? userData.email : null;
    if (!email) {
      alert("User email not found.");
      return;
    }

    fetch(api + '/api/send-reset-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert("A password reset email has been sent to " + email + ".");
        } else {
          alert("Error sending password reset email. Please try again later.");
        }
        // Hide the modal after sending email
        new bootstrap.Modal(document.getElementById("confirmModal")).hide();
      })
      .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      });
  });
});