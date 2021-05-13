var axios = require('axios');
var CryptoJS = require("crypto-js");
var passwordModule = require('../registration/password.js');


/* Global Variables */
var passwordToggles = [];
var passwordFields = [];




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
        var email = getCookieValue("email");
        var session_id = getCookieValue("session-id");
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
                nextCell.password = password;
                nextCell.innerHTML = "*".repeat(password.length);
                let passwordToggle = createPasswordToggle(password);
                nextCell.appendChild(passwordToggle);
                passwordFields.push(nextCell);
            } else if (keys[j] === "hostname") {
                let hyperlink = document.createElement("a");
                hyperlink.href = 'https://' + dataElem[keys[j]];
                hyperlink.innerHTML = dataElem[keys[j]];
                nextCell.appendChild(hyperlink);
            } else if (keys[j] === "isReused") {
                nextCell.innerHTML = dataElem[keys[j]];
                nextCell.appendChild(createDeleteButton(dataElem.hostname));
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
function createPasswordToggle(password) {
    let passwordToggle = document.createElement("LABEL");
    passwordToggle.classList.add("switch");
    passwordToggle.value = false;
    passwordToggle.password = password;

    let checkbox = document.createElement("INPUT");
    checkbox.type = "checkbox";
    passwordToggle.appendChild(checkbox);

    let span = document.createElement("SPAN");
    span.classList.add("slider");
    passwordToggle.appendChild(span);

    passwordToggles.push(passwordToggle);
    return passwordToggle;
}

/*
* Add the button that will allow users to delete entries 
* from their vault
*/
function createDeleteButton(hostname) {
    let deleteButton = document.createElement("IMG");
    deleteButton.title = "Delete Vault Entry"; 
    deleteButton.style.position = "relative";
    deleteButton.style.left = "60%";
    deleteButton.style.cursor = "pointer";
    deleteButton.hostname = hostname;
    deleteButton.src = "../assets/delete.png";
    deleteButton.alt = "delete icon";
    deleteButton.height = "18";
    deleteButton.width = "15";
    return deleteButton;
}


/*
*Driver code for vault page
*/
window.addEventListener('load', () => {
    getUserSession(); // First make sure the user is logged in

    let userEmail = getCookieValue('email');
    let sessionId = getCookieValue('session-id');
    //let userEmail = 'rookiemail2@comcast.net';
    //let sessionId = 'atko1hdmOLadOYV2SyBIqUk0eMlZ7JZsBc8abnt9emk=';
    axios.get(`https://mashypass-app.herokuapp.com/api/vault/all?email=${userEmail}&session-id=${sessionId}`)
    .then(function(vaultData) {
        axios.get(`https://mashypass-app.herokuapp.com/api/analytics/vault/reuse?email=${userEmail}&session-id=${sessionId}`)
        .then(function(reuseData) {
            let parsedData = parseData(vaultData.data, reuseData.data);
            displayData(parsedData);
            document.getElementById('table-body').addEventListener('click', function(event) {
                console.log(event.target.nodeName);
                if (event.target.nodeName === "SPAN") {
                    let password = event.target.parentElement.password;
                    let filler = "*".repeat(password.length);
                    let toggleButton = event.target.parentElement;
                    console.log(toggleButton.value);
                    let passwordField = event.target.parentElement.parentElement;
                    let textToChange = passwordField.childNodes[0];
                    if (toggleButton.value == true) {
                        event.target.parentElement.parentElement.childNodes[0].nodeValue = filler;
                        toggleButton.value = false;
                    } else {
                        textToChange.nodeValue = password;
                        event.target.parentElement.value = true;
                    } 
                } else if (event.target.nodeName === 'IMG') {
                    let deleteVerification = document.getElementById('delete-verification');
                    deleteVerification.style.display = "block";

                    document.getElementById('close').addEventListener('click', () => {
                        deleteVerification.style.display = "none";
                    })

                    document.getElementById('yes-delete').addEventListener('click', () => {
                        let url = event.target.hostname;
                        axios.delete(`https://mashypass-app.herokuapp.com/api/vault?email=${userEmail}&url=${url}&session-id=${sessionId}`)
                        .then(function(response) {
                            console.log(response);
                            window.location.href = "chrome-extension://aofelgdcnljcjeejddhcknappobidfch/html/vault.html";
                        })
                        .catch(function(error) {
                            console.log(error.response.data);
                        })
                    })
                }
            })
        })
        .catch(function(error) {
            console.log(error);
        })
    })
    .catch(function(error) {
        console.log(error.response.data);
    })
})
