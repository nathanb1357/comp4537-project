import { api } from './const.js';

document.addEventListener("DOMContentLoaded", function () {
  // Retrieve and display profile data from localStorage
  const userData = JSON.parse(localStorage.getItem("userToken"));
  //check if token is still valid 
  if (userData.expiry < Date.now()) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "index.html";
  }
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

    fetch(api + '/auth/resetPassword/?email=' + email, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        alert(response.text()); 
        new bootstrap.Modal(document.getElementById("confirmModal")).hide();
      })
      .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      });
  });
});