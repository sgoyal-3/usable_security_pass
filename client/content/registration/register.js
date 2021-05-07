var bcrypt = require('bcryptjs');
const axios = require('axios');
var passwordModule = require('./password.js');


//establish communication connection with background.js
var port = chrome.extension.connect({
	name: "Sample Communication"
});

/*
* Wait until page has loaded, then add event listener to the 
* "Create Account" button that will check the value of email
* and password
*/
window.addEventListener('load', function() {
	const createAccount = document.getElementById('submit');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const password2 = document.getElementById('password2');
    createAccount.addEventListener('click', e => {
        e.preventDefault();
        var validInputs = checkInputs(email, password, password2);
		console.log(passwordModule.createPasswordSuggestion(password));
		if (validInputs) {

			// Generate hash of password
			var salt = bcrypt.genSaltSync(10);
			var hash = bcrypt.hashSync(password.value, salt);

			// Make a POST request to backend
			axios.post('https://mashypass-app.herokuapp.com/api/register', {
				email: `${email.value}`,
				password: `${hash}`
			})
			.then(function(response) {
				console.log(response);
				if(response.status == 201){
					console.log("registered successfully");

					//this code taken from login.js - go through login process automatically
					//upon registration
					let token = "oPB6jRIlzTSqO9J4MgY3";
	                axios.put(`https://mashypass-app.herokuapp.com/api/login?email=${email.value}&token=${token}`)
	                .then(function(resp) {
	                    console.log(resp);
	                    document.cookie = `session-id=${resp.data}; path=/`;
	                    document.cookie = `email=${email.value}; path=/`;
	                    console.log(document.cookie);
						port.postMessage({type:'save-cookies', email: email.value, session_id:resp.data});
						window.location.replace("/html/registration_successful.html");
					})
	                .catch(function(error) {
	                    console.log(error);
	                })
				}
			})
			.catch(function(error) {
				console.log(error);
			});
		}
    });
})


/*
* checkInputs: Check the input fields to make sure:
* - email is valid
* - password is of sufficient strength
* - original password and confirmed password are equivalent
*/
function checkInputs(email, password, password2) {
	// trim to remove the whitespaces
	const emailValue = email.value.trim();
	
	if(emailValue === '') {
		setErrorFor(email, 'Email cannot be blank');
		return false;
	} else if (!isEmail(emailValue)) {
		setErrorFor(email, 'Not a valid email');
		return false;
	} else {
		setSuccessFor(email);
	}
	
	return checkPasswords(password, password2);
}

/*
* setErrorFor: Set the class name on input to change the styling
* to reflect error status
*/
function setErrorFor(input, message) {
	const formControl = input.parentElement.parentElement;
	const small = formControl.querySelector('small');
	formControl.className = 'form-control error';
	small.innerText = message;
}

/*
* setSuccessFor: Change the styling on the input error to reflect 
* successful entry
*/
function setSuccessFor(input) {
	const formControl = input.parentElement.parentElement;
	formControl.className = 'form-control success';
	const small = formControl.querySelector('small');
	small.innerText = "";
}

/*
* isEmail: Make sure email is valid
*/
function isEmail(email) {
	return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

/*
* checkPasswords: Check to make sure password is of sufficient strength
* and also that password === password2
*/
function checkPasswords(password, password2) {
	let passwordValue = password.value.trim();
	let password2Value = password2.value.trim();

	if (passwordValue.length === 0) {
		setErrorFor(password, "Password cannot be blank");
		return false;
	}

	if (password2Value.length == 0) {
		setErrorFor(password2, "Confirmed password cannot be blank");
		return false;
	}

	if (passwordValue !== password2Value) {
		setErrorFor(password2, "Passwords do not match");
		return false;
	}

	setSuccessFor(password);
	setSuccessFor(password2);
	return true;
}
