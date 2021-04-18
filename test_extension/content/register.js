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
        checkInputs(email, password, password2);
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
	const passwordValue = password.value.trim();
	const password2Value = password2.value.trim();
	
	console.log({
		"email": `${emailValue}`,
		"passwordValue" : `${passwordValue}`,
		"password2Value" : `${password2Value}`
	})

	if(emailValue === '') {
		setErrorFor(email, 'Email cannot be blank');
	} else if (!isEmail(emailValue)) {
		setErrorFor(email, 'Not a valid email');
	} else {
		setSuccessFor(email);
	}
	
	checkPasswords(password, password2);
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
	console.log("here");
	const formControl = input.parentElement.parentElement;
	formControl.className = 'form-control success';
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
	let passwordValue = password.value;
	let password2Value = password2.value;

	if (passwordValue !== password2Value) {
		setErrorFor(password2, "Passwords do not match");
		return;
	}

	if (passwordValue.length < 15) {
		setErrorFor(password, "Password must be at least 15 characters long");
	}

	let hasLower = false;
	let hasUpper = false;
	let hasNumeral = false;
	let hasSpecial = false;
	
	let errMessage = `Password must contain at least one lower case letter, one upper case letter, one number and one special character`

	for (var i = 0; i < passwordValue.length; i++) {
		let c = passwordValue.charAt(i);
		if (!isNaN(c * 1)) {
			hasNumeral = true;
		} else if (c = c.toUpperCase()) {
			hasUpper = true;
		} else if (c = c.toLowerCase()) {
			hasLower = true;
		} else {
			hasSpecial = true;
		}
	}

	if (!hasLower || !hasUpper || !hasNumeral || !hasSpecial) {
		setErrorFor(password, errMessage);
	}


}
