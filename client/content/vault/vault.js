var axios = require('axios');
var CryptoJS = require("crypto-js");
var passwordModule = require('../registration/password.js');

/*
* getCookieValue: get the value of a particular cookie
*/
function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
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


/*
* getUserSession: Check if user is still logged in
* If they are not, then redirect them to the login page
*/
function getUserSession(){
    if (document.cookie == "") {
        console.log("no cookies set");
    } else {
        // If cookies are set, check with server to see if session is expired
        console.log("cookies set");
        var email = getCookie("email");
        var session_id = getCookie("session-id");
        axios.get(`https://mashypass-app.herokuapp.com/api/session?email=${email}&session-id=${session_id}`)
        .then(function(response) {
            console.log(response);
        })
        .catch(function(error) {
            console.log(error.response.data);
            window.location.replace('/html/popup.html');
        })
    }
}


/*
* Take in vaultData, which is of form 
* {url, username, password}
* and reuse data which is of form {num_reused, num_sites, websites: []}
* and turn into object of form
* {hostname, password, strength, time to crack, reused:boolean}
*/
function parseData(vaultData, reuseData) {
    let output = [];
    for (var i = 0; i < vaultData.length; i++){
        let vaultEntry = vaultData[i];
        let decrypted = decrypt(vaultEntry.password);
        let passwordStrength = passwordModule.givePasswordFeedback(decrypted);
        let score = passwordStrength.score;
        let timeToCrack = passwordStrength.crackTime;
        let isReused = reuseData.websites.includes(vaultEntry.url);
        output.push({
            hostname: vaultEntry.url,
            password: decrypted,
            score: score,
            timeToCrack: timeToCrack,
            isReused: isReused
        })
    }
    return output;
}


/*
* displayData: Display parsed vault data using HTML elements
*/
function displayData(parsedData){
    for (var i = 0; i < parsedData.length; i++){
        let dataElem = parsedData[i];
        let nextRow = document.createElement("TR");
        let keys = Object.keys(dataElem);
        for (var j = 0; j < keys.length; j++){
            let nextCell = document.createElement("TD");
            if (keys[j] === "password") {
                let password = dataElem[keys[j]];
                nextCell.id = password;
                nextCell.innerHTML = "*".repeat(password.length);
                let passwordToggle = createPasswordToggle();
                console.log(passwordToggle);
                nextCell.appendChild(passwordToggle);
                console.log(nextCell);
            } else {
                nextCell.innerHTML = dataElem[keys[j]];
            }
            nextRow.appendChild(nextCell);
        }
        nextRow.id = dataElem.hostname;
        document.getElementById("table-body").appendChild(nextRow);
    }
}


/*
* createPasswordToggle: Create the HTML necessary for the password
* visibility toggle switch
*/
function createPasswordToggle() {
    let passwordToggle = document.createElement("LABEL");
    passwordToggle.classList.add("switch");
    passwordToggle.value = "OFF";

    let checkbox = document.createElement("INPUT");
    checkbox.type = "checkbox";
    passwordToggle.appendChild(checkbox);

    let span = document.createElement("SPAN");
    span.classList.add("slider");
    passwordToggle.appendChild(span);

    return passwordToggle;
}


/*
* showPassword
*/
function showPassword(toggleElement) {
    let passwordElem = toggleElement.parentElement;
    let password = passwordElem.id;
    if (toggleElement.value === "OFF") {
        passwordElem.innerHTML = password;
        toggleElement.value = "ON";
    } else {
        passwordElem.innerHTML = "*".repeat(password.length);
        toggleElement.value = "OFF";
    }
}


/*
*Driver code for vault page
*/
window.addEventListener('load', () => {
    //getUserSession(); // First make sure the user is logged in

    //let userEmail = getCookieValue('email');
    //let sessionId = getCookieValue('session-id');
    let userEmail = 'rookiemail2@comcast.net';
    let sessionId = '37rG90YpCmY7lhNVphAuPOWSjTmQ8Vt1I3ox9ywPIvY=';
    axios.get(`http://localhost:5000/api/vault/all?email=${userEmail}&session-id=${sessionId}`)
    .then(function(vaultData) {
        axios.get(`http://localhost:5000/api/analytics/vault/reuse?email=${userEmail}&session-id=${sessionId}`)
        .then(function(reuseData) {
            let parsedData = parseData(vaultData.data, reuseData.data);
            displayData(parsedData);
        })
        .catch(function(error) {
            console.log(error);
        })
        .then(function() {
            let toggleButtons = document.getElementsByClassName("switch");
            for (var i = 0; i < toggleButtons.length; i++){
                
                toggleButtons[i].addEventListener('click', showPassword(toggleButtons[i]));
            }
        })

    })
    .catch(function(error) {
        console.log(error.response.data);
    })
})
