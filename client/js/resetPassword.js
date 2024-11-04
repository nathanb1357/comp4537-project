import { api } from './const.js';


document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get("token");
    const email = urlParams.get("email");

    // fetch(api + '/auth/verifyToken/?token=' + resetToken, {
    //     method: 'GET',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // })
    //     .then((response) => {
    //         if (response.status == 500 || response.status == 404 || response.status == 403) {
    //             console.log("Error");
    //         }
    //         return response.text();
    //     })
    //     .then((text) => alert(text))
    //     .catch(error => {
    //         console.error("Error:", error);
    //         alert("An error occurred. Please try again.");
    //     }

    //     )

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
        fetch(api + '/auth/resetPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: resetToken,
                email: email,
                password: newPassword,
            })
        })
            .then(response => response.text())
            .then(data => {
                if (data) {
                    alert(data);
                    window.location.href = "register.html";
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