import { api } from './const.js';

class PasswordResetRequest {
  constructor() {
    this.init();
  }

  init() {
    document.getElementById("submit").addEventListener("click", () => this.handleSubmit());
  }

  async handleSubmit() {
    const email = document.getElementById("email").value;

    try {
      const response = await this.sendResetPasswordRequest(email);
      if (response === "Password reset email sent") {
        alert(response);
        window.location.href = "login.html";
      } else {
        alert(response);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  }

  async sendResetPasswordRequest(email) {
    const response = await fetch(api + '/auth/resetPassword/' + email, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to send reset password request');
    }

    return await response.text();
  }
}

new PasswordResetRequest();
