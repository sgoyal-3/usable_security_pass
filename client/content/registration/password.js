var zxcvbn = require('zxcvbn');

/*
* provideMoreFeedback: Used if the crack time for a password is low
* but there are no suggesstions being given by zxcvbn
*/
function provideMoreFeedback(passwordValue) {
    let isLowerCase = true;
    let noNumbers = true;
    let noSpecial = true;
    for (var i = 0; i < passwordValue.length; i++) {
        let c = passwordValue.charAt(i);
        let asciiCode = passwordValue.charCodeAt(i);

        if (c !== c.toLowerCase()) {
            isLowerCase = false;
        }

        if (!isNaN(c * 1)) {
            noNumbers = false;
        }

        if (!(asciiCode >= 48 && asciiCode <= 57) && !(asciiCode >= 65
            && asciiCode <= 90) && !(asciiCode >= 97 && asciiCode <= 122)) {
                noSpecial = false;
        }

    }

    if (isLowerCase || noNumbers || noSpecial) {
        return `Try adding more capital letters, numbers and special characters`;
    }

    if (passwordValue.charAt(passwordValue.length - 1) === '!') {
        return `Adding ! at the end of your password is very common. Try adding a special character
                middle.`
    }

    if (passwordValue.charAt(0) == passwordValue.charAt(0).toUpperCase) {
        return `Capitalizing the first letter of your password is very common. Try moving capital letters
                to the middle`;
    }

    let commonAppend = hasCommonAppends(passwordValue);
    if (commonAppend.length !== 0) {
        return `Adding digits such as ${commonAppend} at the end of your password is very common. Try 
        putting more digits in the middle`
    }
    return "";
}


function hasCommonAppends(passwordValue) {
    let commonAppends = ['00', '01', '02', '01', '12', '13', '21', '22', '69',
                        '77', '88', '99', '123'];

    for (var i = 0; i < commonAppends.length; i++) {
        let end = passwordValue.length;
        let start = end - commonAppends[i].length;
        if (passwordValue.substr(start, end) === commonAppends[i]) {
            return commonAppends[i];
            
        }
    }
    return "";
}


/*
* createPasswordSuggestion: Suggest a stronger password for user 
* based on the weak password they have provided
*/
function createPasswordSuggestion(password) {
    let passwordValue = password.value;
    let commonAppend = hasCommonAppends(passwordValue);

    // Toggle case of a random character
    let pos1 = Math.floor(Math.random() * passwordValue.length);
    passwordValue = passwordValue.substr(0, pos1) + passwordValue.charAt(pos1).toUpperCase() + 
                    passwordValue.substr(pos1 + 1, passwordValue.length);
    
    // Insert random character in random position
    let pos2 = Math.floor(Math.random() * passwordValue.length);
    let randomChar1 = String.fromCharCode(Math.floor(Math.random() * (126 - 33) + 33));
    passwordValue = passwordValue.substr(0, pos2) + randomChar1 + 
                    passwordValue.substr(pos2, passwordValue. length);                    

    // replace character in random position with random character
    let pos3 = Math.floor(Math.random() * passwordValue.length);
    let randomChar2 = String.fromCharCode(Math.floor(Math.random() * (126 - 33) + 33));
    passwordValue = passwordValue.substr(0, pos3) + randomChar2 + 
                    passwordValue.substr(pos3 + 1, passwordValue. length);  
    
    if (commonAppend.length !== 0) {
        let pos4 = Math.floor(Math.random() * passwordValue.length);
        passwordValue = passwordValue.substr(0, pos4) + commonAppend +
                        passwordValue.substr(pos4, passwordValue.length - (commonAppend.length));
    }

    return passwordValue;
}


/*
* givePasswordFeedback: Gives a user feedback on their entered password
*/
function givePasswordFeedback(password) {
    let passwordValue = password.value;
    let zxcvbnResult = zxcvbn(passwordValue);
    let score = zxcvbnResult.score;
    let crackTimeDisplay = zxcvbnResult.crack_times_display.offline_fast_hashing_1e10_per_second;
    let warning = zxcvbnResult.feedback.warning;
    let suggestions = zxcvbnResult.feedback.suggestions;
    
    document.getElementById('password-display').innerHTML = `Current password: ${passwordValue}`;

    let scoreElement = document.getElementById('score');
    scoreElement.innerHTML = `Score: ${score}/4`;

    let timeToCrackElement = document.getElementById('time-to-crack');
    timeToCrackElement.innerHTML = `Time to crack: ${crackTimeDisplay}`;

    let warningElement = document.getElementById('warning');
    warningElement.innerHTML = `Warnings: ${warning}`

    let suggestionsElement = document.getElementById('suggestions');
    let suggestionString = "Suggestions: ";

    if (score < 4 && suggestions.length == 0) {
        suggestionString += provideMoreFeedback(passwordValue);
    } else {
        for (var i = 0; i < suggestions.length; i++) {
            suggestionString += `${suggestions[i]} \n`
        }
    }

    suggestionsElement.innerHTML = suggestionString;

}


/*
* genSecurePassword: Generate a secure password from scratch
*/
function genSecurePassword(){
    var result = [];
    var characters= "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvxyz1234567890!@#$%^&*()";
    var charactersLength = characters.length;
    for ( var i = 0; i < 20; i++ ) {
        result.push(characters.charAt(Math.floor(Math.random() * 
            charactersLength)));
     }
     return result.join('');
}








window.addEventListener('load', () => {
    let password = document.getElementById("password");
    password.addEventListener('input', () => {
        givePasswordFeedback(password);
    });

})

module.exports.givePasswordFeedback = givePasswordFeedback;
module.exports.createPasswordSuggestion = createPasswordSuggestion;
module.exports.genSecurePassword = genSecurePassword; 