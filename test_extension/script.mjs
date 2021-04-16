/*
* Fetches text from username and password input forms
*/
function fetchEmailPassword() {
    let passwordElement = document.getElementById("password");
    let emailElement = document.getElementById("email");

    return emailElement.value + ", " + passwordElement.value;

}



function ping(message) {
    chrome.runtime.sendMessage("bebffpohmffmkmbmanhdpepoineaegai", 
    message, response => {
        if (chrome.runtime.lastError) {
            console.log("here");
            setTimeout(ping, 1000);
        } else {
            console.log(response);
        }
    });
}



/*
* Displays email and password credentials to the user when they
* click the submit button on a form
*/
function displayOnSubmit() {
    let submitButton = document.getElementById("submit-button");
    submitButton.addEventListener("click", () => {
        ping('ping');
    })
}

displayOnSubmit();