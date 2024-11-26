import { api } from './const.js';
import { userMessages } from '../lang/en.js';

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
      const responseMessage = await this.sendResetPasswordRequest(email);

      // Show success or failure messages based on the response
      if (responseMessage === userMessages.success.passwordReset) {
        alert(userMessages.success.passwordReset);
        window.location.href = "login.html";
      } else {
        alert(responseMessage);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(userMessages.error.passwordResetFailed);
    }
  }

  async sendResetPasswordRequest(email) {
    const response = await fetch(api + '/auth/resetPassword/' + email, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(userMessages.error.passwordResetFailed);
    }

    return await response.text();
  }
}

new PasswordResetRequest();
