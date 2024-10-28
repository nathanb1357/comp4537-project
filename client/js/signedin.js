document.addEventListener("DOMContentLoaded", function () {
    // Retrieve and display profile data from localStorage
    const userData = JSON.parse(localStorage.getItem("userToken"));
    if (userData) {
        document.getElementById("profileUsername").textContent = userData.username || "N/A";
        document.getElementById("profileEmail").textContent = userData.email || "N/A";
        document.getElementById("profileBio").textContent = userData.bio || "N/A";
    } else {
        alert("No user data found. Please log in.");
    }

    // Handle password change form submission
    const changePasswordForm = document.getElementById("changePasswordForm");
    changePasswordForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Get form values
        const currentPassword = document.getElementById("currentPassword").value;
        const newPassword = document.getElementById("newPassword").value;
        const confirmNewPassword = document.getElementById("confirmNewPassword").value;

        // Basic validation
        if (newPassword !== confirmNewPassword) {
            alert("New passwords do not match.");
            return;
        }

        // Here you would typically send a request to your server to update the password
        // For now, we're simulating success.
        fetch(api + "/auth/resetPassword/?email=" + document.getElementById("profileEmail").textContent, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })


        alert("Password updated successfully.");
        changePasswordForm.reset();
        new bootstrap.Modal(document.getElementById("changePasswordModal")).hide();
    });
});