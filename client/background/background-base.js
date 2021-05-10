
var axios = require('axios');

const autofillRequested = new Event('autofill-requested');

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
* displayLoginNotif: Use a Chrome notification to remind a user
* to login when they are on a site that requires them to enter a password
*/
function displayLoginNotif() {

  var notifOptions = {
    type: "basic",
    title: "Login To MashyPass",
    message: `Login to MashyPass to autofill your credentials, save your credentials
to your vault and get help generating a secure password.`,
    iconUrl: "assets/secure.png",
    silent: true,
    buttons: [
      {
        title: "Login To My Account"
      },
    ]
  }

  chrome.notifications.create('login-notif', notifOptions, () => {
    console.log("launching login notif...");
  });

  chrome.notifications.onButtonClicked.addListener((notifId, buttonIdx) => {
    console.log(notifId);
    if (notifId === 'login-notif'){
      chrome.tabs.create({
        url: "chrome-extension://aofelgdcnljcjeejddhcknappobidfch/html/popup.html"
      });
    
      chrome.notifications.clear('login-notif', () => {
        console.log("login-notif is cleared");
      })
    }
  });
}


/*
* displayAddToVaultNotif: Prompt the user to see if they
* would like to add credentials to vault
*/
function displayAddToVaultNotif(vaultEntry) {
  var notifOptions = {
    type: "basic",
    title: "Add to Vault?",
    message: `Would you like to add the credentials for ${vaultEntry.hostname} 
to your MashyPass vault?.`,
    iconUrl: "assets/secure.png",
    silent: true,
    buttons: [
      {
        title: "Maybe later"
      },
      {
        title: "Add to vault"
      }
    ]
  }

  chrome.notifications.create('add-to-vault-notif', notifOptions, () => {
    console.log("launching add to vault notif...");

    chrome.notifications.onButtonClicked.addListener((notifId, buttonIdx) => {
      if (notifId === 'add-to-vault-notif') {
        if (buttonIdx == 1) {
          axios.post(`https://mashypass-app.herokuapp.com/api/vault?session-id=${session_id}&email=${email}`, {
              'url': `${vaultEntry.hostname}`,
              'username' : `${vaultEntry.username}`,
              'password' : `${vaultEntry.password}`
          })
          .then(function(response) {
            console.log(response);
          })
          .catch(function(error) {
            console.log(error);
          })
        } 
        chrome.notifications.clear('add-to-vault-notif', () => {
          console.log("cleared add-to-vault-notif");
        })
      }
    })

  })
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
        chrome.tabs.create({
          url: "chrome-extension://aofelgdcnljcjeejddhcknappobidfch/html/vault.html"
        })
      } else if (buttonIdx == 1) {
        console.log('right button was clicked');
      } else {
        console.log("this doesn't work I guess");
      }
    });
  })
}


/*
* displayAutofillNotif: Ask the user if they would like to autofill
* credentials from their vault
*/
function displayAutofillNotif(vaultEntry){

  var notifOptions = {
    type: "basic",
    title: "Autofill Credentials?",
    message: `Would you like MashyPass to autofill your credentials for ${vaultEntry.hostname}.`,
    iconUrl: "assets/secure.png",
    silent: true,
    buttons: [
      {
        title: "No, thanks"
      },
      {
        title: "Yes, please"
      }
    ]
  }

  chrome.notifications.create('autofill-notif', notifOptions, () => {
    console.log('launching autofill notif...');

    chrome.notifications.onButtonClicked.addListener((notifId, buttonIdx) => {
      if (notifId === 'autofill-notif') {
        if (buttonIdx == 1) {
          autofillRequested.data = vaultEntry;
          window.dispatchEvent(autofillRequested);
        }

        chrome.notifications.clear('autofill-notif', () => {
          console.log("Cleared autofill notif");
        })
      }
    })
  })
}


let modalOpened = false;

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

/*
 this is for the special case in which we have just saved
 cookies upon user log in to Mashypass and now need
 to signal content.js that the user is signed in and get
 he cookies to it (ik this is weird, but it is the best
 workaround i could think of, and the others were even worse)
*/
const event = new Event('saved-cookies');

//communication with content.js 
 chrome.extension.onConnect.addListener(function(port) {

      console.log("Connected .....");
      if(openmodal_request){
        port.postMessage({type: 'openModal', username : username, password: password});
        openmodal_request = false;
      }

      //this is only triggrd when log in gives background cookies to save
      window.addEventListener('saved-cookies', function (e) { 
          console.log('got dem cookies from login');
              port.postMessage({type:'send-cookies2', email:email, session_id:session_id});
          }, false);
      

      window.addEventListener('autofill-requested', function(e) {
        port.postMessage({'type': 'yes-fill', 'data': e.data});
      })

      
      port.onMessage.addListener(function(msg) {
        // Listen for the event.

          console.log(msg);

          if (msg.type === 'show-reuse-alert') {
            displayReuseNotif(msg.data);
          }

          if (msg.type === 'show-login-notif') {
            displayLoginNotif();
          }

          if (msg.type === 'show-autofill-notif') {
            displayAutofillNotif(msg.data);
          }

          if (msg.type === 'show-add-to-vault-notif') {
            displayAddToVaultNotif(msg.data);
          }
          
          if (msg.type === 'open-modal-request' && login_attempt == true) {
            console.log("sending openModal message...");
            port.postMessage({type: 'openModal', 'username' : username, 'password' : password});
          }
          
          
          if (msg.type === 'save-cookies') {
            email = msg.email;
            session_id = msg.session_id;
            console.log("saved cookies: ");
            console.log(email);
            console.log(session_id);
            window.dispatchEvent(event);

          }

          if (typeof(msg.username) != 'undefined'){
            /* 
            save credentials and url of log in page
            when content sends them
            */
            console.log('received login credentials');
            username = msg.username;
            password = msg.password;
            old_url = msg.url;
            login_attempt = true;
            console.log(username);
            console.log(password);
            console.log(login_attempt);
            port.postMessage({'type': 'openModal', 'username': username, 'password':password});

          }
          else if (msg == "modalclosed") {
              /*once the modal has been closed by the user, we should no
              longer open it on pages of the same domain
              */
              login_attempt = false;
          } 
          else if(msg.type == 'send-cookies1'){
            port.postMessage({type:'send-cookies1', email:email, session_id:session_id});
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








