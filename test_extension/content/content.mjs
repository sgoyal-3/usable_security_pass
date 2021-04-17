var s = document.createElement('script');
s.type = "module";
s.src = chrome.runtime.getURL('content/script.mjs');
(document.head||document.documentElement).appendChild(s);
s.onload = function() {
    s.parentNode.removeChild(s);
};


function sendMessage(message) {
    chrome.runtime.sendMessage("bebffpohmffmkmbmanhdpepoineaegai", 
    message, response => {
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            setTimeout(() => sendMessage(message), 1000);
        } else {
            console.log(response);
            if (response.openModal === "true") {
                displayModal();
            } else {
                let submitButton = document.getElementById("submit-button");
                submitButton.addEventListener("click", displayModal);
            } 
        }
    });
}


function displayModal() {
    fetch(chrome.runtime.getURL('/html/modal.html')).then(r => r.text()).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
    })
    .then(() => {
        document.getElementById("modal-email").value = document.getElementById("email").value;
        document.getElementById("modal-pswd").value = document.getElementById("password").value;
        document.querySelector('.bg-modal').style.display = "flex";

    })
    .then(() => {
        document.querySelector('.close').addEventListener("click", function() {
            document.querySelector('.bg-modal').style.display = "none";
        })
    })
    .then(() => {sendMessage({"modalOpened" : true})});
}

sendMessage("openModal?");


