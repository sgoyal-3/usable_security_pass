

function doInCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) {
            console.log(tabArray); 
            tabCallback(tabArray[0]); 
        }
    );
}



let openmodal_request = false;
let login_attempt = false;
var username = "";
var password = "";
var old_url = "";
var new_url = ""



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
           console.log("message recieved: " + msg);

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
            }
            else if (msg == "modalclosed") {
                /*once the modal has been closed by the user, we should no
                longer open it on pages of the same domain
                */
                login_attempt = false;
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
            */
              var old_url_domain = url_domain(old_url);
              var new_url_domain = url_domain(new_url);
              console.log(old_url_domain);
              console.log(new_url_domain);
            
            if(old_url_domain == new_url_domain){
              openmodal_request = true;
            }

            // //precaution? might keep this, we'll see
            // login_attempt = false;
            
        }     
    }
    
});








