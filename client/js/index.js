const api = "http://localhost:3000";



document.getElementById("login").addEventListener("click", function() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    fetch(api + "/auth/login", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username, password: password })
    })
        .then(function(res) {
        return res.json();
        })
        .then(function(data) {
        if (data.success) {
            localStorage.setItem("token", data.token);
            window.location.href = "signedin.html";
            alert("Login successful");
        } else {
            alert("Login failed");
        }
        });
});

document.getElementById("signup").addEventListener("click", function() {
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    fetch(api + "/auth/register", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username, password: password })
    })
        .then(function(res) {
        return res.json();
        })
        .then(function(data) {
        if (data.success) {
            localStorage.setItem("token", data.token);
            window.location.href = "signedin.html";
            alert("Signup successful");
        } else {
            alert("Signup failed");
        }
        });
});