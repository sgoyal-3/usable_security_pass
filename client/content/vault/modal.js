var CryptoJS = require("crypto-js");
var axios = require('axios')


function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}


window.addEventListener('load', () => {
    let addToVaultButton = document.getElementById("add");
    addToVaultButton.addEventListener('click', (e) => {
        e.preventDefault();
        let url = document.location;
        let username = document.getElementById("modal-email").value;
        let password = document.getElementById("modal-password").value;
        var encrypted = CryptoJS.AES.encrypt(password, 'literally any key').toString();

        let email = getCookieValue('email');
        let sessionId = getCookieValue('session-id');
        axios.post(`http://localhost:5000/api/vault?session-id=${sessionId}&email=${email}`, {
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