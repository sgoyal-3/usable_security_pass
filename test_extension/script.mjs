import logSomething from "./background.mjs";
/*
* Fetches text from username and password input forms
*/
function fetchEmailPassword() {
    let passwordElement = document.getElementById("password");
    let emailElement = document.getElementById("email");

    return emailElement.value + ", " + passwordElement.value;

}

/*
* Displays email and password credentials to the user when they
* click the submit button on a form
*/
function displayOnSubmit() {
    let submitButton = document.getElementById("submit-button");
    submitButton.addEventListener("click", () => {
        alert(fetchEmailPassword());
    });
    
}

displayOnSubmit();