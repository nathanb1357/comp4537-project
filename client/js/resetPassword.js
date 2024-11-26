import { api } from './const.js';
import { userMessages } from '../lang/en.js';

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
      alert(userMessages.error.passwordMismatch);
      return;
    }

    try {
      const result = await this.resetPassword(newPassword);
      if (result) {
        alert(userMessages.success.reset);
        window.location.href = "register.html";
      } else {
        alert(userMessages.error.resetFailed);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(userMessages.error.generic);
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
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to reset password");
    }

    return await response.text();
  }
}

new PasswordReset();
