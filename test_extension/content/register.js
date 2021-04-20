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
	let passwordValue = password.value;
	let password2Value = password2.value;

	if (passwordValue.length === 0) {
		setErrorFor(password, "Password cannot be blank");
		return;
	}

	if (password2Value.length == 0) {
		setErrorFor(password2, "Confirmed password cannot be blank");
		return;
	}

	if (passwordValue !== password2Value) {
		setErrorFor(password2, "Passwords do not match");
		return;
	}

	setSuccessFor(password);
	setSuccessFor(password2);
}
