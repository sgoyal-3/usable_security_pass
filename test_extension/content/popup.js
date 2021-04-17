window.addEventListener('load', function() {
    let registerLink = document.getElementById("register-link");
    registerLink.addEventListener('click', function() {
        chrome.tabs.create({url: "html/register.html"});
    })
})