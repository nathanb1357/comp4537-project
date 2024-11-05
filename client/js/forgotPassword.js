import { api } from './config.js';


document.getElementById("submit").addEventListener("click", function () {
    const email = document.getElementById("email").value;
    fetch(api + '/auth/resetPassword/' + email, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.text())
        .then(data => {
            if (data == "Password reset email sent") {
                alert(data);
                window.location.href = "login.html";
            } else {
                alert(data);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        });
});