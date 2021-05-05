var CryptoJS = require("crypto-js");
var axios = require('axios')


function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
/*
window.addEventListener('load', () => {
    let addToVaultButton = document.getElementById("add");
    addToVaultButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("hello I am here!!");
        let url = document.window.location.hostname;
        let username = document.getElementById("modal-email").value;
        let password = document.getElementById("modal-password").value;
        var encrypted = CryptoJS.AES.encrypt(password, 'literally any key').toString();

        // let email = getCookieValue('email');
        // let sessionId = getCookieValue('session-id');
        let email = 'rookiemail@comcast.net';
        let sessionId = 'MOdMbeM-spt4OwqAevqwowsbdmNqy_grq9RvMhOwYxg=';
        axios.post(`https://mashypass-app.herokuapp.com/api/vault?-id=${sessionId}&email=${email}`, {
            'url': `${url}`,
            'username' : `${username}`,
            'password' : `${encrypted}`
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        })
        
    })
})
*/


function encrypt(msgString, key) {
    // msgString is expected to be Utf8 encoded
    var iv = CryptoJS.lib.WordArray.random(16);
    var encrypted = CryptoJS.AES.encrypt(msgString, key, {
        iv: iv
    });
    return iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
}



var key = CryptoJS.enc.Utf8.parse('1234567890123456');
var userEmail = 'rookiemail2@comcast.net';
var sessionId = 'e5rwES2J6Nlj1_D4pv5mLibhFWL2E5xjXptINv8QFpw=';
axios.post(`http://localhost:5000/api/vault?email=${userEmail}&session-id=${sessionId}`, {
    "url": "www.example.com",
    "username": "username",
    "password": `${encrypt('password', key)}` 
})
.then(function(response) {
    axios.post(`http://localhost:5000/api/vault?email=${userEmail}&session-id=${sessionId}`, {
        "url": "www.example1.com",
        "username": "username",
        "password": `${encrypt('password', key)}` 
    })
    .then(function(resp) {
        console.log(resp);
    })
    .catch(function(error) {
        console.log(error.response.data);
    })
})
.catch(function(error) {
    console.log(error.response.data);
})



