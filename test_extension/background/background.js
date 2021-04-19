
function doInCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) {
            console.log(tabArray); 
            tabCallback(tabArray[0]); 
        }
    );
}




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
communication with content.js and popup.js. Both content.js and popup.js
will communicate on the same port, so we should make sure to differentiate
them if it becomes necessary
*/
 chrome.extension.onConnect.addListener(function(port) {
      console.log("Connected .....");


      port.onMessage.addListener(function(msg) {
           console.log("message recieved" + msg);
           console.log(msg);

           if (msg.modalOpened) {
                modalOpened = msg.modalOpened;
                port.postMessage('modal has been opened');
            } else if (msg == "openModal?") {
                port.postMessage("got message openModal?");
                port.postMessage({'openModal' : `${modalOpened}`})
            } else {
                port.postMessage('pong');
            }


           port.postMessage("Hi content.js");
      });
 })


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







