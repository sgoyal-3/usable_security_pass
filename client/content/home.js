var axios = require('axios');

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
    

/*
* logged in to see vault?
*/
function loggedInVault(){
    if (document.cookie == "") {
        console.log("no cookies set");
        window.location.href = '/html/popup.html';
    } else {
        // If cookies are set, check with server to see if session is expired
        console.log("cookies set");
        var email = getCookie("email");
        var session_id = getCookie("session-id");
        axios.get(`https://mashypass-app.herokuapp.com/api/session?email=${email}&session-id=${session_id}`)
        .then(function(response) {
            console.log(response);
            window.location.href = '/html/vault.html';
        })
        .catch(function(error) {
            console.log(error.response.data);
            window.location.href = '/html/popup.html';
        })
    }
}

function loggedInGeneral(){
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


            //add log out button
            var innerstring = "<a>Hello, ";
            var full = innerstring.concat(getCookie("email").split("@")[0]).concat('</a>');
            console.log(full);
            document.getElementById("1").innerHTML = full;

            document.getElementById("2").innerHTML = '<a href="">Log out</a>';

            var button = document.createElement("button");
            button.className = "main-button";
            button.id = "vault-button";
            button.innerHTML = "My Vault";
            var element = document.getElementById("nav");
            console.log(element)
            element.appendChild(button);

            document.getElementById("vault-button").addEventListener("click", function() {
              loggedInVault(); 
            });


            //"<button id="vault-button" class="main-button">My Vault</button>"


            //replace ccreate acccount with logout
            // var element = document.getElementById("logout");
            // element.innerHTML = '<a href="">Log out</a>';
        })
        .catch(function(error) {
            console.log(error.response.data);
            
        })
    }
}


window.addEventListener('load', function() {
    loggedInGeneral();


})