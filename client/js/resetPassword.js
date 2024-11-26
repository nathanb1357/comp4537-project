import { api } from './const.js';

class PasswordReset {
  constructor() {
    this.resetToken = this.getUrlParameter("token");
    this.email = this.getUrlParameter("email");
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.setupPasswordResetForm();
    });
  }

  getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  setupPasswordResetForm() {
    const resetPasswordForm = document.getElementById("resetPasswordForm");
    resetPasswordForm.addEventListener("submit", (event) => this.handleSubmit(event));
  }

  async handleSubmit(event) {
    event.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    // Basic validation for password match
    if (newPassword !== confirmNewPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const result = await this.resetPassword(newPassword);
      if (result) {
        alert(result);
        window.location.href = "register.html";
      } else {
        alert("Error resetting password. Please try again later.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  }

  async resetPassword(newPassword) {
    const response = await fetch(api + '/auth/resetPassword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.resetToken,
        email: this.email,
        password: newPassword,
      })
    });

    if (!response.ok) {
      throw new Error("Failed to reset password");
    }

    return await response.text();
  }
}

new PasswordReset();
