import { api } from './const.js';


document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");

    fetch(api + '/auth/verifyToken/?token=' + resetToken, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (response.status == 500 || response.status == 404 || response.status == 403) {
                alert(repsonse.text());
                window.location.href = "index.html";
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        }

        )

    const resetPasswordForm = document.getElementById("resetPasswordForm");
    resetPasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        // Basic validation for password match
        if (newPassword !== confirmNewPassword) {
            alert("Passwords do not match.");
            return;
        }

        // Send request to reset password
        fetch('/auth/resetPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken,
                newPassword: newPassword
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Password has been reset successfully. You can now log in.");
                    window.location.href = "login.html"; // Redirect to login page
                } else {
                    alert("Error resetting password. Please try again later.");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("An error occurred. Please try again.");
            });
    });
});