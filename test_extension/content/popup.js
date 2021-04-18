/*
* Send the user to the register page if they click the "Create an Account link"
*/
window.addEventListener('load', function() {
    let registerLink = document.getElementById("register-link");
    registerLink.addEventListener('click', function() {
        chrome.tabs.create({url: "html/register.html"});
    })
})