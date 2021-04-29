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
    } else{
        console.log("cookies set");

         //can take these things out later maybe

        //send session id and email to background.js so content.js can access it 
        var email = getCookie("email");
        var session_id = getCookie("session-id");
        port.postMessage({email: email, session_id: session_id});
        console.log("Sent email and sesion_id");


        window.location.replace("/html/login_successful.html");
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



