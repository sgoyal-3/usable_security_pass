var axios = require('axios');

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

//log out - do i need to do anythging else besides wiping cookies, like do something with actual sessionid??
function logout(){
    //wipe cookies
    document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    //reset page navbar to unlogged in state
    document.getElementById("1").innerHTML = '<a href="/html/register.html">Create An Account</a>';
    document.getElementById("2").innerHTML = '<a href="/html/popup.html">Log in</a>';
    document.getElementById("vault-button").remove();

}
    



function loggedInGeneral(){
    if (document.cookie == "") {
        console.log("no cookies set");  
        
    } else {
        // If cookies are set, check with server to see if session is expired
        console.log("cookies set");
        console.log("cookies: ");
        console.log(document.cookie);
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
              window.location.href = '/html/vault.html';
            });

            document.getElementById("2").addEventListener("click", function() {
              logout(); 
            });


        })
        .catch(function(error) {
            console.log(error.response.data);   
        })
    }
}


window.addEventListener('load', function() {
    loggedInGeneral();


})