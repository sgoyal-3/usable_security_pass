
function doInCurrentTab(tabCallback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (tabArray) {
            console.log(tabArray); 
            tabCallback(tabArray[0]); 
        }
    );
}



chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    var activeTabId;
    doInCurrentTab(function(tab) { activeTabId = tab.id});
    console.log(activeTabId);
    chrome.pageAction.show(442);
    sendResponse('pong');
});