/*
This version of the content script must be converted to a "watchified" form via the command
 watchify client/content/content-base.js -o client/content/content.js -v


This is the driver code for the content script. This is what is run on every page
whose URL fits the matches clause specified in manifest.json
*/


var CryptoJS = require("crypto-js");
var axios = require('axios')


function getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

var email = "";
var session_id = "";


const event = new Event('build');



//establish communication connection with background.js
 var port = chrome.extension.connect({
      name: "Sample Communication"
 });


//listen for request to open modal
 port.onMessage.addListener(function(msg) {
      console.log("message recieved" + msg);

      if(typeof(msg.username) != 'undefined'){
        console.log("opening modal");
        console.log(msg.username);
        console.log(msg.password);
        displayModal(msg.username, msg.password);
      }
      if(typeof(msg.email) != 'undefined' && typeof(msg.session_id) != 'undefined'){
        email = msg.email;
        session_id = msg.session_id;
        console.log("Email and session_ids retrieved");
        // Dispatch the event.
        window.dispatchEvent(event);
      }
      // if(typeof(msg.registration_point) != 'undefined'){
      //   //fill in registration point field in registration-successful.html if that is the current page
      //   console.log("got registration point and it is: ");
      //   console.log(msg.registration_point);
      // }
 });



// Listen for the event.
window.addEventListener('build', function (e) { 
        console.log('hi');
        /*
       let url = document.location;
        console.log(session_id);
        console.log(email);
        console.log(url);
        */
        let testEmail = "rookiemail@comcast.net";
        let url = "www.example2.com";
        let sessionId = "123456789"

        console.log("sending axios now");
        axios.get(`https://mashypass-app.herokuapp.com/api/vault?session-id=${sessionId}&email=${testEmail}&url=${url}`, {})
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        })
        

}, false);


 /*
search for username/password fields
wait until page js runs and dom fully loaded to do so
 */
window.addEventListener ("load", search, false);

function search(){

    var username_exists = false;
    var password_exists = false;

    var username1 =  document.getElementById("email");
    var password1 = document.getElementById("password");
    if (typeof(username1) != 'undefined' && username1 != null)
    {
      // username1 Exists.
      console.log("username1 exists");
      username_exists = true;
      
    }

    if (typeof(password1) != 'undefined' && password1 != null)
    {
      // password1 exists
      console.log("password1 exists");
      password_exists = true;
      
    }

    console.log(username_exists);
    console.log(password_exists);

    //if username and password exists, put listener on submit button
    if(password_exists && username_exists){

        port.postMessage("Cookies pls");

     

        /*

        COMMENT THIS BACK AFTER
        trying to find a way for it detect when form is submitted via enter
        key as well as click, but it doesn't seem to work
        
        console.log("putting listener on login-form");
        var submit = document.getElementById("login-form");
        submit.addEventListener("submit", function() 
        {   
            console.log("submitted");
            var username_contents = document.getElementById("email").value;
            var password_contents = document.getElementById("password").value;
            sendCreds(username_contents, password_contents, window.location.href); 
        });

        var submit = document.getElementById("submit-button");
        submit.addEventListener("click", function() 
        {   
            console.log("submitted");
            var username_contents = document.getElementById("email").value;
            var password_contents = document.getElementById("password").value;
            sendCreds(username_contents, password_contents, window.location.href); 
        });

        */
    }
    

}


//sends credentials and info to background.js
function sendCreds(username, password, url){
    console.log("hi im sendCreds");
    console.log(username);
    console.log(password);
    console.log(url);
    port.postMessage({username : username, password : password, url : url});
}



/*
* displayModal: Display the modal popuup on a website asking user if they would like to
* save their recently entered credentials to their vault
*/
function displayModal(username, password) {
    console.log("in display modal");
    fetch(chrome.runtime.getURL('/html/modal.html')).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
    })
    .then(() => {
        document.getElementById("modal-email").value = username;
        document.getElementById("modal-password").value = password;
        document.querySelector('.bg-modal').style.display = "flex";

    })
    .then(() => {
        document.querySelector('.close').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";
            port.postMessage("modalclosed");
        })
        document.getElementById('noadd').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";
            port.postMessage("modalclosed");
        })
        document.getElementById('add').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";
            port.postMessage("modalclosed");
        })
    })
}


/*
request registration point if current page is registration_successul.html
*/
// console.log("current relative path in window is: ");
// console.log(window.location.pathname+window.location.search);
// if(window.location.pathname+window.location.search == "html/registration_successul.html"){
//     port.postMessage("Registration point request");
// }





