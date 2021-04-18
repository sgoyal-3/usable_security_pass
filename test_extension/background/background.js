
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

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        if (request.modalOpened) {
            modalOpened = request.modalOpened;
            sendResponse('modal has been opened');
        } else if (request === "openModal?") {
            sendResponse({'openModal' : `${modalOpened}`})
        } else {
            sendResponse('pong');
        }
        
    }
)