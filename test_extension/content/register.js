
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
	
	/*
	if(passwordValue === '') {
		setErrorFor(password, 'Password cannot be blank');
	} else {
		setSuccessFor(password);
	}
	
	if(password2Value === '') {
		setErrorFor(password2, 'Password2 cannot be blank');
	} else if(passwordValue !== password2Value) {
		setErrorFor(password2, 'Passwords must not match');
	} else{
		setSuccessFor(password2);
	}
	*/
	checkPasswords(password, password2);
}

function setErrorFor(input, message) {
	const formControl = input.parentElement.parentElement;
	const small = formControl.querySelector('small');
	formControl.className = 'form-control error';
	small.innerText = message;
}

function setSuccessFor(input) {
	console.log("here");
	const formControl = input.parentElement.parentElement;
	formControl.className = 'form-control success';
}
	
function isEmail(email) {
	return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

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
