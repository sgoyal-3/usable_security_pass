/*
This version of the content script must be converted to a "watchified" form via the command
 watchify client/content/content-base.js -o client/content/content.js -v


This is the driver code for the content script. This is what is run on every page
whose URL fits the matches clause specified in manifest.json
*/


var CryptoJS = require("crypto-js");
var axios = require('axios');
var passwordModule = require('./registration/password.js');
var loginModule = require('./login/login.js');


function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

var email = "";
var sessionId = "";

const event = new Event('build');

//establish communication connection with background.js
 var port = chrome.extension.connect({
      name: "Sample Communication"
 });


//listen for request to open modal
 port.onMessage.addListener(function(msg) {

    console.log("message recieved" + msg);



    if(typeof(msg.username) != 'undefined'){
        console.log("opening modal");
        console.log(msg.username);
        console.log(msg.password);
        displayModal(msg.username, msg.password);
    }
    if(typeof(msg.email) != 'undefined' && typeof(msg.session_id) != 'undefined'){
        email = msg.email;
        sessionId = msg.session_id;
        document.cookie = `session-id=${sessionId}; path=/`;
        document.cookie = `email=${email}; path=/`;
        console.log("Email and session_ids retrieved");
        // Dispatch the event.
        window.dispatchEvent(event);
    }

    // if(typeof(msg.registration_point) != 'undefined'){
    //   //fill in registration point field in registration-successful.html if that is the current page
    //   console.log("got registration point and it is: ");
    //   console.log(msg.registration_point);
    // }

    if (msg.type === "show-vault"){
        console.log("Received message to open vault");
    }



 });


// Listen for the event.
window.addEventListener('build', function (e) { 
    console.log('event has fired');
    getUserSession();
}, false);


/*
* Main driver code that will be executed on every webpage that matches
* the filter in manifest.json
*/
window.addEventListener("load", () => {

    port.postMessage({'type':'open-modal-request'});

    if (onRegistrationPage()){
        console.log("On a registration page")
        port.postMessage({type:'send-cookies'});
        displayPasswordGenButton();
        modifyPageContent();
    }
});


/********************************************************/
//         Functions that call backend endpoints
/********************************************************/


/*
* getUserSession: check if user has correct session-id: If not, query the backend
* for a new session-id
*/
function getUserSession() {
    // Check if user is logged in
    axios.get(`https://mashypass-app.herokuapp.com/api/session?email=${email}&session-id=${sessionId}`)
    .then(function(response) {
        console.log(response); // User is logged in, nothing else to do
        console.log("User alread logged in, exiting function...");
    })
    .catch(function(error) {
        console.log(error.response.data);
        displayLoginPage();
    })
}

/*
* encrypt: Utility function to encrypt user passwords before
* sending them to the backend
*/
function encrypt(msgString, key) {
    // msgString is expected to be Utf8 encoded
    var iv = CryptoJS.lib.WordArray.random(16);
    var encrypted = CryptoJS.AES.encrypt(msgString, key, {
        iv: iv
    });
    return iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
}


/*
* sendVaultCredentials: Send a user's vault credentials to the server
*/
function sendVaultCredentials(username, password) {
    let userEmail = getCookieValue('email');
    let userSessionId = getCookieValue('session-id');
    let url = window.location.hostname;
    var key = CryptoJS.enc.Utf8.parse('1234567890123456');
    var encrypted = encrypt(password, key);
    axios.post(`https://mashypass-app.herokuapp.com/api/vault?session-id=${userSessionId}&email=${userEmail}`, {
        'url': `${url}`,
        'username' : `${username}`,
        'password' : `${encrypted}`
    })
    .then(function (response) {
        console.log(response);
        // Check reuse statistics after sending to vault
        getReuseStatistics(userEmail, userSessionId);
    })
    .catch(function (error) {
        console.log(error.response.data);
    })
}


/*
* getReuseStatistics: Get user's password reuse statistics from backend
*/
function getReuseStatistics(userEmail, userSessionId) {
    axios.get(`https://mashypass-app.herokuapp.com/api/analytics/vault/reuse?email=${userEmail}&session-id=${userSessionId}`)
    .then(function(response) {
        console.log(response);
        displayReuseStatistics(response.data);
        //setTimeout(() => {getReuseStatistics(userEmail, sessionId)}, 60000);
    })
    .catch(function(error) {
        console.log(error.response.data);
    })
}


//sends credentials and info to background.js
function sendCreds(username, password, url){
    console.log("hi im sendCreds");
    console.log(username);
    console.log(password);
    console.log(url);
    port.postMessage({username : username, password : password, url : url});
}


/********************************************************/
//         Functions to Display Modal Popups
/********************************************************/


/*
* displayLoginPage: Show a dialog box of the login screen, prompting
* the user to login into their account or register for one
*/
function displayLoginPage() {
    fetch(chrome.runtime.getURL('/html/login_modal.html')).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
    })
    .then(() => {
        document.getElementById("close").addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-modal').style.display = "none";
        })
        console.log(document.getElementById("login"));
        document.getElementById("login").addEventListener('click', (e) => {
            e.preventDefault();
            console.log("click event callback...");
            loginModule.loginUser();
        })
    })
}


/*
* displayPaswordGenButton: Display button that, when clicked, will 
* open a dialog box that allows a user to generate a secure password
*/
function displayPasswordGenButton() {
    let passwordInput = document.getElementById("password");
    passwordInput.style.backgroundImage = null;
    fetch(chrome.runtime.getURL('/html/password_gen.html')).then(r => r.text()).then(html => {
        passwordInput.parentElement.insertAdjacentHTML('beforeend', html);
    })
    .then(() => {
        window.addEventListener('click', ({ target }) => {
            let clickInsidePopup = (target.id == 'dialog-box' || 
                                    target.parentElement.id == 'dialog-box' ||
                                    target.parentElement.parentElement.id == 'dialog-box');
            if (!clickInsidePopup && target.id !== 'lock-icon-container' && target.id !== 'lock-icon') {
                let dialogBox = document.getElementById('dialog-box');
                dialogBox.style.display = "none";
                dialogBox.value = "OFF";
            }
        })

        document.getElementById("lock-icon-container").addEventListener("click", () => {

            let dialogBox = document.getElementById("dialog-box");
            if (dialogBox.value === "ON") {
                dialogBox.value = "OFF";
                dialogBox.style.display = "none"; 
            } else {
                dialogBox.value = "ON";
                dialogBox.style.display = "flex";
            }

            passwordInput.addEventListener('input', () => {
                fillInPasswordFeedback(passwordInput);
            })
            
            let showPassword = document.getElementById("show-password");
            showPassword.addEventListener('click', (e) => {
                e.preventDefault();
                let currentPassword = document.getElementById("current-password");
                if (showPassword.value === "ON") {
                    showPassword.value = "OFF";
                    showPassword.innerHTML = "Show Current Password";
                    currentPassword.style.display = "none";
                } else {
                    showPassword.value = "ON";
                    showPassword.innerHTML = "Hide Current Password";
                    currentPassword.style.display = "flex";
                }
            })

            document.getElementById("auto-generate").addEventListener("click", (e) => {
                e.preventDefault();
                passwordInput.value = passwordModule.genSecurePassword();
                fillInPasswordFeedback(passwordInput);
            })

            document.getElementById("mashify").addEventListener("click", (e) => {
                e.preventDefault();
                passwordInput.value = passwordModule.createPasswordSuggestion(passwordInput);
                fillInPasswordFeedback(passwordInput);
            })

        })
    })
}


/*
* displayModal: Display the modal popuup on a website asking user if they would like to
* save their recently entered credentials to their vault
*/
function displayModal(username, password) {
    console.log("in display modal");
    fetch(chrome.runtime.getURL('/html/modal.html')).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
    })
    .then(() => {
        document.getElementById("modal-email").value = username;
        document.getElementById("modal-password").value = password;
        document.querySelector('.bg-modal').style.display = "flex";

    })
    .then(() => {
        document.querySelector('.close').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";
            port.postMessage("modalclosed");
        })
        document.getElementById('noadd').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";
            port.postMessage("modalclosed");
        })
        document.getElementById('add').addEventListener("click", function(e) {
            e.preventDefault();
            sendVaultCredentials(username, password);
            document.querySelector('.bg-modal').style.display = "none";
            port.postMessage("modalclosed");
        })
    })
}


/*
* fillInPasswordFeedback: Appropriately style the password feedback dialog 
* box in response to the value of the password input field
*/
function fillInPasswordFeedback(passwordInput) {
    let strengthObject = passwordModule.givePasswordFeedback(passwordInput.value);
    document.getElementById("crack-time").innerText = "Time to crack: " + strengthObject.crackTime;
    document.getElementById("suggestions").innerText = strengthObject.suggestions;
    let strengthMeter = document.getElementById("strength-meter");
    if (strengthObject.score == 0) {
        strengthMeter.style.width = "20%";
        strengthMeter.style.background = "red";
    } else if (strengthObject.score == 1) {
        strengthMeter.style.width = "40%";
        strengthMeter.style.background = "orange";
    } else if (strengthObject.score == 2) {
        strengthMeter.style.width = "60%";
        strengthMeter.style.background = "yellow";
    } else if (strengthObject.score == 3) {
        strengthMeter.style.width = "80%";
        strengthMeter.style.bacgkround = "#90ee90";
    } else if (strengthObject.score = 4) {
        strengthMeter.style.width = "100%";
        strengthMeter.style.background = "green";
    } else {
        strengthMeter.style.width = "100%";
        strengthMeter.style.background = "black";
    }

    document.getElementById("current-password").innerHTML = "Current password: " + passwordInput.value;
}


/*
* displayReuseStatistics: Send a message to the backgorund script
* in order to alert user to password reuse via browser notification
*/
function displayReuseStatistics(reuseStatistics) {
    port.postMessage({
        "type": "show-reuse-alert",
        "data": reuseStatistics
    })
}


/********************************************************/
//         Functions for Page Filtering
/********************************************************/

/*
* modifyPageContent: Add event listeners to the page DOM that will show
* modal popup when submit button is clicked
*/
function modifyPageContent(){

    var submit = document.getElementById("submit-button");
    submit.addEventListener("click", function(e) 
    {   
        e.preventDefault();    
        console.log("submitted");
        var urlContents = window.location.hostname;
        var usernameContents = document.getElementById("email").value;
        var passwordContents = document.getElementById("password").value;
        sendCreds(usernameContents, passwordContents, urlContents);
    });
}


/*
* Check to see if we are on a registration page
*/
function onRegistrationPage() {
    
    let passwordField = document.getElementById("password");
    let url = window.location.toString();
    return (typeof(passwordField) !== 'undefined' && passwordField !== null 
    && !url.includes("login"));
}



/*
request registration point if current page is registration_successul.html
*/
// console.log("current relative path in window is: ");
// console.log(window.location.pathname+window.location.search);
// if(window.location.pathname+window.location.search == "html/registration_successul.html"){
//     port.postMessage("Registration point request");
// }























