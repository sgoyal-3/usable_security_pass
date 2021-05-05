
var axios = require('axios');

function doInCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) {
            console.log(tabArray); 
            tabCallback(tabArray[0]); 
        }
    );
}


/*
* Use a Chrome notification to display password reuse statistics
* to the user
*/
function displayReuseNotif(reuseStatistics) {
  let numReused = `${reuseStatistics.num_reused}`;
  let numSites = `${reuseStatistics.num_sites}`;


  var notifOptions = {
    type: "basic",
    title: "Security Alert",
    message: `MashyPass has detected ${numReused} reused password(s) across ${numSites} accounts. 
We highly recommend that you change these passwords.`,
    iconUrl: "assets/secure.png",
    silent: true,
    buttons: [
      {
        title: "Change Passwords"
      },
      {
        title: "More Information"
      }
    ]
  }

  chrome.notifications.create("password-reuse-notif", notifOptions, () => {
    console.log('launching reuse notification...');
    
    setTimeout(() => displayReuseNotif(reuseStatistics), 2.16e7); // Notify user every six hours

    chrome.notifications.onButtonClicked.addListener((notifId, buttonIdx) => {
      console.log(notifId);
      if (buttonIdx == 0) {
        console.log('left button was clicked');
      } else if (buttonIdx == 1) {
        console.log('right button was clicked');
      } else {
        console.log("this doesn't work I guess");
      }
    });
  })
}

displayReuseNotif({
  num_reused: 1,
  num_sites: 3,
  websites: [
    "www.example.com",
    "www.example1.com",
    "www.example2.com"
  ]
})












let modalOpened = false;

//these are now being taken care of by the long-term connection with onConnect
/*
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    console.log(request);
    sendResponse('pong');
});
*/
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         console.log(request);
//         if (request.modalOpened) {
//             modalOpened = request.modalOpened;
//             sendResponse('modal has been opened');
//         } else if (request === "openModal?") {
//             sendResponse({'openModal' : `${modalOpened}`})
//         } else {
//             sendResponse('pong');
//         }
        
//     }
// )


/*
Uh idk if we need this
communication with content.js and popup.js. Both content.js and popup.js
will communicate on the same port, so we should make sure to differentiate
them if it becomes necessary
*/
 // chrome.extension.onConnect.addListener(function(port) {
 //      console.log("Connected .....");


 //      port.onMessage.addListener(function(msg) {
 //           console.log("message recieved" + msg);
 //           console.log(msg);

 //           if (msg.modalOpened) {
 //                modalOpened = msg.modalOpened;
 //                port.postMessage('modal has been opened');
 //            } else if (msg == "openModal?") {
 //                port.postMessage("got message openModal?");
 //                port.postMessage({'openModal' : `${modalOpened}`})
 //            } else {
 //                port.postMessage('pong');
 //            }


 //           port.postMessage("Hi content.js");
 //      });
 // })


/*
This will allow us to detect a change in the url of the active tab
This will be useful for detecting that the tab reloaded after 
a successful log in so we can make sure to refresh the modal popup
on the new page
*/
chrome.tabs.query({active: true, currentWindow: true},function(tabs) {
   // chrome.tabs.sendMessage(tabs[0].id, {message: "hi"}, function(response) {
   //      console.log(response);
   //  });
   chrome.extension.onConnect.addListener(function(port) {
      console.log("Connected .....");
      port.postMessage("tabUrlChange")
    })


}); 


let openmodal_request = false;
let login_attempt = false;
var username = "";
var password = "";
var old_url = "";
var new_url = "";
var registration_point = "";

var email = "";
var session_id = "";



//from https://stackoverflow.com/questions/8498592/extract-hostname-name-from-string
function url_domain(data) {
  var    a      = document.createElement('a');
         a.href = data;
  return a.hostname;
}



//communication with content.js 
 chrome.extension.onConnect.addListener(function(port) {
      console.log("Connected .....");
      if(openmodal_request){
        port.postMessage({username : username, password: password});
        openmodal_request = false;
      }

      port.onMessage.addListener(function(msg) {
          console.log(msg);

          if (msg.type === 'show-reuse-alert') {
            displayReuseNotif(msg.data);
          }

           if (typeof(msg.username) != 'undefined'){
              /* 
              save credentials and url of log in page
              when content sends them
              */
              username = msg.username;
              password = msg.password;
              old_url = msg.url;
              login_attempt = true;
              console.log(username);
              console.log(password);
              console.log(old_url);
              console.log(old_url);
              console.log(new_url);
            }
            else if (msg == "modalclosed") {
                /*once the modal has been closed by the user, we should no
                longer open it on pages of the same domain
                */
                login_attempt = false;
            } 
            else if(typeof(msg.email) != 'undefined' && typeof(msg.session_id) != 'undefined'){
              email = msg.email;
              session_id = msg.session_id;
              console.log(email);
              console.log(session_id);
            }
            else if(msg == "Cookies pls"){
              port.postMessage({email:email, session_id:session_id});
            }

      });
 })


/*
This will allow us to detect a change in the url of the active tab
This will be useful for detecting that the tab reloaded after 
a successful log in so we can make sure to refresh the modal popup
on the new page
*/
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
    if (tab.active && change.url) {
        console.log("you are here: "+ change.url);     
        new_url = change.url; 


        /*
        only do this if a previous page was a login page 
        and the user has not yet decided to either add or not 
        add credentials to vault
        */
        if(login_attempt){
              /*
              compare new and old domains
              if they are the same, set openmodal_request to true 
              the next time the connection is refreshed (which happens really often)
              a message containing the credentials and request to open modal with
              creds filled in will be sent to content.js

              old_url is only ever set to the url of a log in page (in above response logic),
              so we will always be comparing the new domain to the last seen login page
            
              var old_url_domain = url_domain(old_url);
              var new_url_domain = url_domain(new_url);
              console.log(old_url_domain);
              console.log(new_url_domain);
            
            if(old_url_domain == new_url_domain){
              openmodal_request = true;
            }

            */

            //actually just open it regardless of domain
            openmodal_request = true;

            // //precaution? might keep this, we'll see
            // login_attempt = false;
            
        }     
    }
    
});








