var bcrypt = require('bcryptjs');
const axios = require('axios');

 //establish communication connection with background.js
 var port = chrome.extension.connect({
      name: "Sample Communication"
 });


 /*
 * getSessionId: make repeated requests to server in order to retrieve 
 * session-id token
 */
function getSessionId(email){
    let token = "oPB6jRIlzTSqO9J4MgY3";
    axios.put(`https://mashypass-app.herokuapp.com/api/login?email=${email}&token=${token}`)
    .then(function(resp) {
        console.log(resp);
        document.cookie = `session-id=${resp.data}; path=/`;
        document.cookie = `email=${email}; path=/`;
        //send session id and email to background.js so content.js can access it 
        console.log("sending cookies to background....");
        port.postMessage({type: 'save-cookies', email: email, session_id: resp.data})
    })
    .then(function() {
        console.log(window.location.host);
        if (document.getElementById('login-modal') == null) {
            window.location.replace("/html/login_successful.html");
        } else {
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('login-successful-modal').style.display = 'flex'; 
        }
        
    })
    .catch(function(error) {
        console.log(error);
        //setTimeout(() => getSessionId(email), 500);
    })
}


/*
* loginUser: check user's entered credentials against server credentials
* If they are correct, log the user in, set cookies and send values to 
* background.js
*/
function loginUser(){
    let email = document.getElementById("mashy-email").value;
    let password = document.getElementById("mashy-password").value;

    console.log(email);
    // Get user's hashed password from server
    axios.get(`https://mashypass-app.herokuapp.com/api/login?email=${email}`)
    .then(function(response) {
        console.log(response)
        let dbPassword = response.data;
        if (bcrypt.compareSync(password, dbPassword)) {
            console.log("Access Granted");
            //display login success
            getSessionId(email);
        } else {
            console.log("Access Denied");
        }
    })
    .catch(function(error) {
        console.log(error);
        console.log("User with email does not exist");
    });
}


window.addEventListener('load', function() {
    let login = document.getElementById("login");
    login.addEventListener('click', function(e) {
        e.preventDefault();
        loginUser();
    });
})

module.exports.getSessionId = getSessionId;
module.exports.loginUser = loginUser;


