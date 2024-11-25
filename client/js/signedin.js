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

  document.getElementById('logout').addEventListener('click', function (event) {
    event.preventDefault();
    fetch(api + '/auth/logout', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.text())
      .then(data => {
        window.location.href = "index.html";
      })
      .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      });
  });

  fetch(api + '/api/getUserInfo', {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        window.location.href = "index.html";
      }
      return response.json();
    })
    .then(data => {
      if (data.user_role == "admin" && window.location.href.includes("signedinUser.html")) {
        window.location.href = "signedinAdmin.html";
      } else if (data.user_role == "user" && window.location.href.includes("signedinAdmin.html")) {
        window.location.href = "signedinUser.html";
      }
      document.getElementById("profileEmail").textContent = data.user_email || "N/A";
      document.getElementById("apiUsage").textContent = data.user_calls || "N/A";
      if (data.user_role == "admin") {
        fetch(api + '/api/getApiStats', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(response => {
            if (!response.ok) {
              alert("Error with apistats: " + response.json());
            }
            return response.json();
          })
          .then(data => {
            let table = document.getElementById("endpointTable");
            let header = table.createTHead();
            let headerRow = header.insertRow(0);
            let headerCell1 = headerRow.insertCell(0);
            let headerCell2 = headerRow.insertCell(1);
            let headerCell3 = headerRow.insertCell(2);
            headerCell1.textContent = "Method";
            headerCell2.textContent = "Endpoint";
            headerCell3.textContent = "Calls";
            data.forEach(api => {
              let row = table.insertRow(-1);
              let cell1 = row.insertCell(0);
              let cell2 = row.insertCell(1);
              let cell3 = row.insertCell(2);
              cell1.textContent = api.endpoint_method;
              cell2.textContent = api.endpoint_path;
              cell3.textContent = api.endpoint_calls;
            });
          })
          .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
          });
        fetch(api + '/api/getUsers', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(response => {
            if (!response.ok) {
              alert("Error with getting users: " + response.json());
            }
            return response.json();
          }
          )
          .then(data => {
            let table = document.getElementById("userTable");
            let header = table.createTHead();
            let headerRow = header.insertRow(0);
            let headerCell1 = headerRow.insertCell(0);
            let headerCell2 = headerRow.insertCell(1);
            let headerCell3 = headerRow.insertCell(2);
            let headerCell4 = headerRow.insertCell(3);
            headerCell1.textContent = "User ID";
            headerCell2.textContent = "User Email";
            headerCell3.textContent = "User Calls";
            headerCell4.textContent = "User Role";
            data.forEach(user => {
              let row = table.insertRow(-1);
              let cell1 = row.insertCell(0);
              let cell2 = row.insertCell(1);
              let cell3 = row.insertCell(2);
              let cell4 = row.insertCell(3);
              cell1.textContent = user.user_id;
              cell2.textContent = user.user_email;
              cell3.textContent = user.user_calls;
              cell4.textContent = user.user_role;
              cell4.contentEditable = true;
              let select = document.createElement("select");
              let optionAdmin = document.createElement("option");
              optionAdmin.value = "admin";
              optionAdmin.text = "Admin";
              let optionUser = document.createElement("option");
              optionUser.value = "user";
              optionUser.text = "User";

              if (user.user_role === "admin") {
                optionAdmin.selected = true;
              } else {
                optionUser.selected = true;
              }

              select.appendChild(optionAdmin);
              select.appendChild(optionUser);
              row.cells[3].replaceChild(select, row.cells[3].childNodes[0]);

              select.addEventListener("change", function () {
                fetch(api + '/api/editRole', {
                  method: 'PATCH',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    email: user.user_id,
                    role: select.value
                  })
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

document.getElementById("confirmDeleteAccount").addEventListener("click", function (event) {
  event.preventDefault();
  fetch(api + '/api/deleteUser/email=' + document.getElementById("profileEmail").textContent, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      alert(data);
      window.location.href = "index.html";
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    });
});

document.getElementById("predictImageButton").addEventListener("click", function (event) {
  event.preventDefault();
  const file = document.getElementById("profileImage").files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  fetch(api + '/api/predictImage', {
    method: 'POST',
    credentials: 'include',
    headers: {
    },
    body: formData
  })
    .then(response => response.text())
    .then(data => {
      document.getElementById("predictionResult").textContent = data;
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
