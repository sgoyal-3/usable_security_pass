var bcrypt = require('bcryptjs');
const axios = require('axios');

 //establish communication connection with background.js
 var port = chrome.extension.connect({
      name: "Sample Communication"
 });




window.addEventListener('load', function() {
    let login = document.getElementById("login");
    login.addEventListener('click', function(e) {
        e.preventDefault();
        let email = document.getElementById("email").value;
        let password = document.getElementById("password").value;

        console.log(email);
        // Get user's hashed password from server
        axios.get(`https://mashypass-app.herokuapp.com/api/login?email=${email}`)
        .then(function(response) {
            console.log(response)
            let dbPassword = response.data;
            if (bcrypt.compareSync(password, dbPassword)) {
                console.log("Access Granted");
                let token = "oPB6jRIlzTSqO9J4MgY3";

                 //send session id and email to background.js so content.js can access it 
                port.postMessage({email: email, session_id: resp.data})

                //display login success
                window.location.replace("/html/login_successful.html");


                //this keeps saying User with email: rookiemail@comcast.net is not present even when i get access granted
                axios.put(`https://mashypass-app.herokuapp.com/api/login?email=${email}&token=${token}`)
                .then(function(resp) {
                    console.log(resp);
                    document.cookie = `session-id=${resp.data}; path=/`;
                    document.cookie = `email=${email}; path=/`;
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

