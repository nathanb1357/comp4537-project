import { api } from './const.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.attachEventListeners();
      this.fetchUserInfo();
    });
  }

  attachEventListeners() {
    const profileImageInput = document.getElementById('profileImage');
    profileImageInput.addEventListener('change', this.previewImage);

    const logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', (event) => this.handleButtonClick(logoutButton, () => this.logoutUser(event)));

    const deleteAccountButton = document.getElementById('confirmDeleteAccount');
    deleteAccountButton.addEventListener('click', (event) => this.handleButtonClick(deleteAccountButton, () => this.deleteAccount(event)));

    const predictImageButton = document.getElementById('predictImageButton');
    predictImageButton.addEventListener('click', (event) => this.handleButtonClick(predictImageButton, () => this.predictImage(event)));

    const confirmSendEmailButton = document.getElementById('confirmSendEmail');
    confirmSendEmailButton.addEventListener('click', (event) => this.handleButtonClick(confirmSendEmailButton, () => this.sendPasswordResetEmail(event)));
  }

  async handleButtonClick(button, action) {
    button.disabled = true;
    try {
      await action();
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      button.disabled = false;
    }
  }

  previewImage(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.getElementById('selectedImage');
        img.src = e.target.result;
        img.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  }

  async logoutUser(event) {
    event.preventDefault();
    const response = await fetch(`${api}/auth/logout`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      window.location.href = "index.html";
    } else {
      alert("Logout failed. Please try again.");
    }
  }

  async deleteAccount(event) {
    event.preventDefault();
    const response = await fetch(`${api}/api/deleteUser`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (data.error) {
      alert(data.error);
    } else {
      alert(data.message);
      window.location.href = "index.html";
    }
  }

  async predictImage(event) {
    event.preventDefault();
    const file = document.getElementById("profileImage").files[0];
    if (!file) {
      alert("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    const loadingAnimation = document.getElementById("loadingAnimation");
    loadingAnimation.style.display = "block";

    try {
      const response = await fetch(`${api}/api/predictImage`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) {
        alert("Failed to predict image.");
        return;
      }
      const prediction = await response.json();
      const predictionData = prediction;
      document.getElementById("result").textContent = `Predicted Class: ${predictionData.predicted_class}, 
      Confidence: ${predictionData.confidence}, 
      Class Confidence: ${predictionData.class_confidence}`;
    } finally {
      loadingAnimation.style.display = "none";
    }
  }

  async sendPasswordResetEmail() {
    const email = document.getElementById("profileEmail").textContent;
    if (!email) {
      alert("User email not found.");
      return;
    }

    const response = await fetch(`${api}/api/resetPassword/${email}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const message = await response.text();
    alert(message);
    new bootstrap.Modal(document.getElementById("confirmModal")).hide();
  }

  async fetchUserInfo() {
    try {
      const response = await fetch(`${api}/api/getUserInfo`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        window.location.href = "index.html";
        return;
      }
      const data = await response.json();
      this.handleUserRoleRedirection(data);
      this.populateUserInfo(data);

      if (data.user_role === "admin") {
        this.fetchAdminData();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  }

  handleUserRoleRedirection(data) {
    const currentUrl = window.location.href;
    if (data.user_role === "admin" && currentUrl.includes("signedinUser.html")) {
      window.location.href = "signedinAdmin.html";
    } else if (data.user_role === "user" && currentUrl.includes("signedinAdmin.html")) {
      window.location.href = "signedinUser.html";
    }
  }

  populateUserInfo(data) {
    document.getElementById("content").style.display = "block";
    if (data.overLimit) {
      document.getElementById("apiNotification").style.display = "block";
    }
    document.getElementById("profileEmail").textContent = data.user_email || "N/A";
    document.getElementById("apiUsage").textContent = data.user_calls || "N/A";
  }

  async fetchAdminData() {
    try {
      const apiStatsResponse = await fetch(`${api}/api/getApiStats`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const apiStats = await apiStatsResponse.json();
      this.populateApiStatsTable(apiStats);

      const usersResponse = await fetch(`${api}/api/getUsers`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const users = await usersResponse.json();
      this.populateUsersTable(users);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  }

  populateApiStatsTable(data) {
    const table = document.getElementById("endpointTable");
    const header = table.createTHead();
    const headerRow = header.insertRow(0);
    ["Method", "Endpoint", "Calls"].forEach((text, i) => {
      const cell = headerRow.insertCell(i);
      cell.textContent = text;
    });

    data.forEach((api) => {
      const row = table.insertRow(-1);
      row.insertCell(0).textContent = api.endpoint_method;
      row.insertCell(1).textContent = api.endpoint_path;
      row.insertCell(2).textContent = api.endpoint_calls;
    });
  }

  populateUsersTable(data) {
    const table = document.getElementById("userTable");
    const header = table.createTHead();
    const headerRow = header.insertRow(0);
    ["User ID", "User Email", "User Calls", "User Role"].forEach((text, i) => {
      const cell = headerRow.insertCell(i);
      cell.textContent = text;
    });

    data.forEach((user) => {
      const row = table.insertRow(-1);
      row.insertCell(0).textContent = user.user_id;
      row.insertCell(1).textContent = user.user_email;
      row.insertCell(2).textContent = user.user_calls;
      this.createRoleDropdown(row.insertCell(3), user);
    });
  }

  createRoleDropdown(cell, user) {
    const select = document.createElement("select");
    ["admin", "user"].forEach((role) => {
      const option = document.createElement("option");
      option.value = role;
      option.text = role;
      option.selected = user.user_role === role;
      select.appendChild(option);
    });

    select.addEventListener("change", () => {
      fetch(`${api}/api/editRole`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.user_email, role: select.value })
      })
        .then(response => response.json())
        .then(data => {
          alert(data.message);
        }
        )
        .catch(error => {
          console.error("Error:", error);
          alert("An error occurred. Please try again.");
        });
    });

    cell.appendChild(select);
  }
}

new App();
