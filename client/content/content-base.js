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


/********************************************************/
//                     Util functions
/********************************************************/


/* 
* getCookieValue: get value of specific cookie from jar
*/
function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


/* 
* url_domain: Extract top-level domain from url
* Ex. www.stackoverflow.com/login?q=asdfdsfads => stackoverflow.com
*/
function url_domain(data) {
  var    a      = document.createElement('a');
         a.href = data;
  return a.hostname;
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
* decrypt: Decrypt user's passwords
*/
function decrypt(ciphertextStr) {
    var key = CryptoJS.enc.Utf8.parse('1234567890123456');
    var ciphertext = CryptoJS.enc.Base64.parse(ciphertextStr);
    // split IV and ciphertext
    var iv = ciphertext.clone();
    iv.sigBytes = 16;
    iv.clamp();
    ciphertext.words.splice(0, 4); // delete 4 words = 16 bytes
    ciphertext.sigBytes -= 16;

    // decryption
    var decrypted = CryptoJS.AES.decrypt({ciphertext: ciphertext}, key, {
        iv: iv
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}


/********************************************************/
//                     Global vars
/********************************************************/
var email = "";
var sessionId = "";


var passwordField = null;
var usernameField = null;

const event = new Event('build');


/********************************************************/
//                      Core logic
/********************************************************/

//establish communication connection with background.js
 var port = chrome.extension.connect({
      name: "Sample Communication"
 });


 port.onMessage.addListener(function(msg) {

    console.log("message recieved" + msg);

    if(typeof(msg.username) != 'undefined'){
        console.log("opening modal");
        console.log(msg.username);
        console.log(msg.password);
        displayModal(msg.username, msg.password);
    }

    /*
        This is an acknowledgement of cookies that are sent upon initial
        on-page-load request for cookies
    */
    if(msg.type == 'send-cookies1' && (typeof(msg.email) != 'undefined' && typeof(msg.session_id) != 'undefined')){
        email = msg.email;
        sessionId = msg.session_id;
        document.cookie = `session-id=${sessionId}; path=/`;
        document.cookie = `email=${email}; path=/`;
        console.log("Email and session_ids retrieved 1");
        console.log(email);
        console.log(sessionId);
        // Dispatch the event.
        window.dispatchEvent(event);
    }
    
    /*
       This is a special acknolwedegment of cookies that are sent upon a user logging in
       We will save the cookies and initatie core logic by calling in main
    */
     if(msg.type == 'send-cookies2' && (typeof(msg.email) != 'undefined' && typeof(msg.session_id) != 'undefined')){
        email = msg.email;
        sessionId = msg.session_id;
        document.cookie = `session-id=${sessionId}; path=/`;
        document.cookie = `email=${email}; path=/`;
        console.log("Email and session_ids retrieved 2 ");
        //call main
        main();
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


/*
* On page load
* 1) Send refresh vault modal request - this is 
*    essential for persistence of vault modal after
*    log in is clicked
* 2) If we are on a login or registration page, we need
*    to get ready to do stuff... make intitial request for 
*    email and sessionId cookies. When background responds with them,
*    content (this script) will save what it got and event below will firee
*    
*/
window.addEventListener("load", () => {
    port.postMessage({type:'open-modal-request'});

    if (onLoginPage() || onRegistrationPage()){
      port.postMessage({type:'send-cookies1'});  
    }  
});



/*
    Check to see if user is logged in
*/
window.addEventListener('build', function (e) { 
    console.log('got dem cookies');
    console.log('event has fired');
    getUserSession();
}, false);



/*
* Main driver code that will be executed on every webpage that matches
* the filter in manifest.json once we have confirmed user is logged in
*/
function main(){

    if (onLoginPage()){
        console.log("On a login page")
        //initiate logic for login page (autofill and stuff)
        loginPageLogic();
    }

    if (onRegistrationPage()){
        console.log("On a registration page")
        displayPasswordGenButton();
        modifyPageContent();
    }
}




function loginPageLogic(){
    console.log("in loginPageLogic")

    var url = url_domain(document.location);
 
    console.log("sending axios now with following email and session id: ");
    console.log(email);
    console.log(sessionId);


    axios.get(`https://mashypass-app.herokuapp.com/api/vault?session-id=${sessionId}&email=${email}&url=${url}`, {})
    .then(function (response) {
        //creds for this url found in vault
        console.log(response);
        console.log("creds present in vault - autofill time...");
        username = response.data.username;
        password = decrypt(response.data.password);
        displayAutofill(username, password);

    })
    .catch(function (error) {
        console.log(error.response.data);
        //space before the word Vault is essential for the comparison!!!
        var comp = " Vault with url: ".concat(url, " is not present");
        console.log("comp is: ");
        console.log(comp);
        if(error.response.data == comp){
            //no creds for this url yet, can't autofill, get ready to add to vault  
            console.log("putting listener on login-form");

             /*
            TODO: find a way for it detect when form is submitted via enter
            key as well as click, but it doesn't seem to work
            */
            // var submit = document.getElementById("login-form");
            // submit.addEventListener("submit", function() 
            // {   
            //     console.log("submitted");
            //     var username_contents = document.getElementById("email").value;
            //     var password_contents = document.getElementById("password").value;
            //     sendCreds(username_contents, password_contents, window.location.href); 
            // });

            var submit = document.getElementById("submit-button");
            submit.addEventListener("click", function() 
            {   
                console.log("submitted");
                var username_contents = document.getElementById("email").value;
                var password_contents = document.getElementById("password").value;
                sendCreds(username_contents, password_contents, window.location.href); 
            });
            
        }

        console.log(error.response.status);
        console.log(error.response.headers);
    })
}





/********************************************************/
//         Functions that call backend endpoints
/********************************************************/


/*
* getUserSession: check if user has correct session-id: If not, query the backend
* for a new session-id
*/
function getUserSession() {
    console.log("In getUserSession")
    // Check if user is logged in
    //if email="" and sessionId="" that means def not logged on, axios req would fail so we should just exit now
    if (email == "" && sessionId == ""){
        console.log("give up");
        displayLoginPage();
    }
    else{
         axios.get(`https://mashypass-app.herokuapp.com/api/session?email=${email}&session-id=${sessionId}`)
        .then(function(response) {
            console.log(response); // User is logged in, nothing else to do
            console.log("User alread logged in, exiting function...");
            //if user is logged in already, we can proceed to core logic (main)
            main();
        })
        .catch(function(error) {
            console.log(error.response.data);
            displayLoginPage();
        })
    } 
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
//         Functions to Display Modals/Popups
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
* displayAutofill: Display the modal popuup on a website asking user if they would like to
* autofill login credentials from MashyPass vault
*/
function displayAutofill(username, password) {
    console.log("in displayAutofill");
    fetch(chrome.runtime.getURL('/html/autofill.html')).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
    })
    .then(() => {
        document.querySelector('.bg-modal').style.display = "flex";
    })
    .then(() => {
        document.querySelector('.close').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";  
        })
        document.getElementById('noauto').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";
        })
        document.getElementById('auto').addEventListener("click", function(e) {
            e.preventDefault();
            //zhu li, do the thing!
            usernameField.value = username;
            passwordField.value = password;
            document.querySelector('.bg-modal').style.display = "none";  
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
    if (reuseStatistics.num_reused > 0) {
        port.postMessage({
            "type": "show-reuse-alert",
            "data": reuseStatistics
        })
    }
}


/********************************************************/
//         Functions for Page Filtering/Management
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
* Check to see if we are on a login page
*/
function onLoginPage() {
    /*
    A generic method for extracting the DOM element corresponding to 
    username and password inputs: select all elements in the page 
    DOM that have an id, type, or class that contains the word 
    "username" or "email", or "password." This covers almost all
    cases in my experience.
    */
    var username_candidates = Array.from(document.querySelectorAll('input[id*="email"]'));
    username_candidates = username_candidates.concat(Array.from(document.querySelectorAll('input[type*="email"]')));
    username_candidates = username_candidates.concat(Array.from(document.querySelectorAll('input[class*="email"]')));
    username_candidates = username_candidates.concat(Array.from(document.querySelectorAll('input[id*="username"]')));
    username_candidates = username_candidates.concat(Array.from(document.querySelectorAll('input[class*="username"]')));
    username_candidates = username_candidates.concat(Array.from(document.querySelectorAll('input[type*="username"]')));
    console.log(username_candidates);

    var password_candidates = Array.from(document.querySelectorAll('input[id*="password"]'));
    password_candidates = password_candidates.concat(Array.from(document.querySelectorAll('input[type*="password"]')));
    password_candidates = password_candidates.concat(Array.from(document.querySelectorAll('input[class*="password"]')));
    console.log(password_candidates);


    /*right now, just taking the first password/username field in the array to be correct
      can tweak this if this assumption does not hold
      NOTE: important to save the DOM elements in the global vars
      passwordField and usernameField so that autofill can access it if needed
    */
    if (password_candidates.length != 1){
        passwordField = password_candidates[0];
    }
    else if (password_candidates.length == 0){
        passwordField = null; //it will already be null from instantiation - these is here for reminder
    }

     if (username_candidates.length != 1){
        usernameField = username_candidates[0];
    }
    else if (username_candidates.length == 0){
        usernameField = null; //it will already be null from instantiation - these is here for reminder
    }

    /*
    TODO
    But how to distinguish login page from regisration page? 
    Both registration and log in will have username/password fields...
    A couple ideas:

    1) Look at text in form submit buttons. If it says login or something
    along those lines, this is probably a log in form and thus a login page
    
    Below, we are putting all text attached to a button or submit element
    in a form into an array, and then can search that array for text like "log in"

    var button_texts = [];
    var formsCollection = Array.from(document.getElementsByTagName("form"));
    console.log(formsCollection);
    // for (var i = 0; i < formsCollection.length; i++) {
    //    var submits = Array.from(formsCollection[i].querySelectorAll('input[type=submit]'));
    //    submits = submits.concat(Array.from(formsCollection[i].querySelectorAll('button')));
    //    for (var j = 0; j < submits.length; j++){
    //       button_texts.push(submits[j].innerHTML);
    //    }
    // }

    
    2) Look at all text in a form. If we see the word log in a lot, 
    this is probably a log in page

    for (var i = 0; i < formsCollection.length; i++) {
        console.log(formsCollection[i].innerHTML);
        if (formsCollection[i].innerHTML.includes("login") || formsCollection[i].innerHTML.includes("Login")){
            console.log("log in indicaator in this form");
        }
    }


    */

    /*
    For now, just stick with previous method that works for stackoverflow
    */

    let url = window.location.toString();
    return ((passwordField && usernameField) && url.includes("login")); 
    /*
    Note that many login pages don't contain log in in their url (e.g., facebook's doesn't)
    */
}





/*
request registration point if current page is registration_successul.html
*/
// console.log("current relative path in window is: ");
// console.log(window.location.pathname+window.location.search);
// if(window.location.pathname+window.location.search == "html/registration_successul.html"){
//     port.postMessage("Registration point request");
// }























