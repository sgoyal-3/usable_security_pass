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
        let passwordStrength = passwordModule.givePasswordFeedback(vaultEntry['password']);
        let score = passwordStrength.score;
        let timeToCrack = passwordStrength.crackTime;
        let isReused = reuseData.websites.includes(vaultEntry.url);
        output.push({
            hostname: vaultEntry.url,
            password: vaultEntry.password,
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
    
}





/*
* Driver code for vault page
*/
window.addEventListener('load', () => {
    //getUserSession(); // First make sure the user is logged in

    //let userEmail = getCookieValue('email');
    //let sessionId = getCookieValue('session-id');
    let userEmail = 'rookiemail2@comcast.net';
    let sessionId = 'KNdbJJLKYGaHG_mgwr_lmkrwFfCNcS9-9s1hirS63dA=';
    axios.get(`http://localhost:5000/api/vault/all?email=${userEmail}&session-id=${sessionId}`)
    .then(function(vaultData) {
        console.log(vaultData);
        axios.get(`http://localhost:5000/api/analytics/vault/reuse?email=${userEmail}&session-id=${sessionId}`)
        .then(function(reuseData) {
            console.log(reuseData);

            let parsedData = parseData(vaultData.data, reuseData.data);
            console.log(parsedData);

        })
        .catch(function(error) {
            console.log(error);
        })

    })
    .catch(function(error) {
        console.log(error.response.data);
    })
})