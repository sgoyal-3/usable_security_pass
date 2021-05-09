var axios = require('axios');

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
    


//establish communication connection with background.js
 var port = chrome.extension.connect({
      name: "Sample Communication"
 });

// if session saved, redirect to login_succsesful page
window.addEventListener('load', function() {

    if(document.cookie == ""){
        console.log("no cookies set");
    } else {
        // If cookies are set, check with server to see if session is expired
        console.log("cookies set");
        //var email = getCookie("email");
        //var session_id = getCookie("session-id");
        var email = "";
        var session_id = "";
        axios.get(`https://mashypass-app.herokuapp.com/api/session?email=${email}&session-id=${session_id}`)
        .then(function(response) {
            port.postMessage({email: email, session_id: session_id}); // send cookies to background.js
            window.location.replace("/html/login_successful.html");
        })
        .catch(function(error) {
            console.log(error.response.data);
        })
    }
})


/*
* Send the user to the register page if they click the "Create an Account link"
*/
window.addEventListener('load', function() {
    let registerLink = document.getElementById("register-link");
    registerLink.addEventListener('click', function() {
        //redirect
        chrome.tabs.create({url: "html/register.html"});
    })


})


/*
* Send the user to the home page if they click the home link
*/
window.addEventListener('load', function() {
    let registerLink = document.getElementById("home-link");
    registerLink.addEventListener('click', function() {
        //redirect
        chrome.tabs.create({url: "html/home.html"});
    })


})



