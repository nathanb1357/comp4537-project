import { api } from './const.js';

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('profileImage').addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.getElementById('selectedImage');
        img.src = e.target.result;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('resetPasswordButton').addEventListener('click', function () {
    localStorage.clear();
    window.location.href = 'index.html';
  });

  // Retrieve and display profile data from localStorage
  const userData = localStorage.getItem("userToken");
  //check if token is still valid
  if (!userData) {
    window.location.href = "register.html";
  }

  if (userData.expiry < Date.now()) {
    alert("Your session has expired. Please log in again.");
    window.location.href = "register.html";
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
      if (data.user_role == "admin" && window.location.href.includes("signedinUser.html")) {
        window.location.href = "signedinAdmin.html";
      } else if (data.user_role == "user" && window.location.href.includes("signedinAdmin.html")) {
        window.location.href = "signedinUser.html";
      }
      document.getElementById("profileEmail").textContent = data.user_email || "N/A";
      document.getElementById("apiUsage").textContent = data.user_calls || "N/A";
      if (data.user_role == "admin") {
        fetch(api + '/auth/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "authorization": "Bearer " + userData
          }
        })
          .then(response => response.json())
          .then(data => {
            let table = document.getElementById("userTable");
            let header = table.createTHead();
            let headerRow = header.insertRow(0);
            let headerCell1 = headerRow.insertCell(0);
            let headerCell2 = headerRow.insertCell(1);
            let headerCell3 = headerRow.insertCell(2);
            headerCell1.textContent = "User ID";
            headerCell2.textContent = "User Email";
            headerCell3.textContent = "User Calls";
            data.forEach(user => {
              let row = table.insertRow(-1);
              let cell1 = row.insertCell(0);
              let cell2 = row.insertCell(1);
              let cell3 = row.insertCell(2);
              cell1.textContent = user.user_id;
              cell2.textContent = user.user_email;
              cell3.textContent = user.user_calls;
            });
          })
          .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
          });
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    });
});

document.getElementById("uploadImageButton").addEventListener("click", function () {
  const file = document.getElementById("profileImage").files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  fetch(api + '/auth/uploadImage', {
    method: 'POST',
    headers: {
      "authorization": "Bearer " + localStorage.getItem("userToken")
    },
    body: formData
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

document.getElementById("predictImageButton").addEventListener("click", function () {
  fetch(api + '/api/predictImage', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem("userToken")
    }
  })
    .then(response => response.text())
    .then(data => {
      document.getElementById("result").textContent = data;
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

  fetch(api + '/api/resetPassword/' + email, {
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
