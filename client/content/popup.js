var axios = require('axios');

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
    

/*
* getUserSession: check if user has correct session-id: If not, query the backend
* for a new session-id
*/
function getUserSession() {
    console.log("In getUserSession");
    // Check if user is logged in
    email = getCookie("email");
    sessionId = getCookie("session-id");
    //if email="" and sessionId="" that means def not logged on, axios req would fail so we should just exit now
    if (email == "" && sessionId == ""){
        console.log("User def not loggeed in");
        //def not logged in, don't change anyhing
    } else {  
         axios.get(`https://mashypass-app.herokuapp.com/api/session?email=${email}&session-id=${sessionId}`)
        .then(function(response) {
            console.log(response); // User is logged in, nothing else to do
            console.log("User already logged in, exiting function...");
            window.location.replace("/html/login_successful.html");
        })
        .catch(function(error) {
            console.log(error);
        })
    } 
}



//establish communication connection with background.js
 var port = chrome.extension.connect({
      name: "Sample Communication"
 });

// if session saved, redirect to login_succsesful page
window.addEventListener('load', function() {

    getUserSession();

        
    
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



