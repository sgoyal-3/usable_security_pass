var bcrypt = require('bcryptjs');
const axios = require('axios');

window.addEventListener('load', function() {
    let login = document.getElementById("login");
    login.addEventListener('click', function(e) {
        e.preventDefault();
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;

        console.log(email);
        // Get user's hashed password from server
        axios.get(`http://localhost:5000/api/login?email=${email}`)
        .then(function(response) {
            console.log(response)
            let dbPassword = response.data;
            if (bcrypt.compareSync(password, dbPassword)) {
                console.log("Access Granted");
                let token = "oPB6jRIlzTSqO9J4MgY3";
                axios.put(`http://localhost:5000/api/login?email=${email}&token=${token}`)
                .then(function(resp) {
                    console.log(resp);
                    document.cookie = `session-id=${resp.data}; path=/`;
                    console.log(document.cookie);
                })
                .catch(function(error) {
                    console.log(error);
                })
            } else {
                console.log("Access Denied");
            }
        })
        .catch(function(error) {
            console.log(error);
            console.log("User with email does not exist");
        });

    });

})

