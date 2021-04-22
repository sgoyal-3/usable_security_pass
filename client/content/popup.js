/*
* Send the user to the register page if they click the "Create an Account link"
*/
window.addEventListener('load', function() {
    let registerLink = document.getElementById("register-link");
    registerLink.addEventListener('click', function() {
        chrome.tabs.create({url: "html/register.html"});
    })
})



/*
testing getting page DOM. I know it's weird to have this here and not 
 in content.js, but it works quite well
 */
window.addEventListener('DOMContentLoaded', (event) => {
    console.log("Popup DOM fully loaded and parsed");

    function modifyDOM() {
        //You can play with your DOM here or check URL against your regex
        console.log('Tab script:');
        console.log(document.body);
        return document.body.innerHTML;
    }
    
    /*
    //We have permission to access the activeTab, so we can call chrome.tabs.executeScript:
    chrome.tabs.executeScript({
        code: '(' + modifyDOM + ')();' //argument here is a string but function.toString() returns function's code
    }, (results) => {
        //Here we have just the innerHTML and not DOM structure
        console.log('Popup script:')
        //console.log(results[0]);
    });
    */
});


// //communication with background.js, will be necessary for sending DOM 
 // var port = chrome.extension.connect({
 //      name: "Sample Communication"
 // });
 // port.postMessage("Hi BackGround from popup");
 // port.onMessage.addListener(function(msg) {
 //      console.log("message recieved" + msg);
 // });

/*
* Send the user to the register page if they click the "Create an Account link"
*/
window.addEventListener('load', function() {
    let registerLink = document.getElementById("register-link");
    registerLink.addEventListener('click', function() {
        chrome.tabs.create({url: "html/register.html"});
    })
})


