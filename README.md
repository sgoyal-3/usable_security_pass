# MASHYPass Password Manager

### Team Members
Mandy La, Ajay Chopra, Shreya Goyal, Hadleigh Schwartz, Yichen Zhu

### Introduction

MAHSYPass is a lightweight password manager browser extension that helps users to keep track of their passwords, create 
stronger passwords and avoid password reuse. It is currently only available on Google Chrome.

### Development

##### Running the Browser Extension
First, clone the repository on your local machine with the following command:
```
git clone https://github.com/sgoyal-3/usable_security_pass.git mashypass
```
Then, on Google Chrome, go to the following [extensions page](chrome://extensions/). Select the option
"Load Unpacked" from the upper left corner. If you do not see this option, make sure "Developer Mode" is 
toggled in the upper right corner.
Once you select "Load Unpacked," you should be presented with a standard file browser. Choose the **client**
subdirectory of the repository you just cloned. The extension should be installed and enabled immediately and you should
see its icon in the extensions menu located in the top right corner of your browser.

##### Using Watchify
[Watchify](https://www.npmjs.com/package/watchify) is a command-line utility that allows you to use `require()` calls to import modules that were installed 
via npm. Any file that requires an npm installed module, i.e. has a line like:
```
var CryptoJs = require('crypto-js');
```
needs to be "watchified". This can be done via the `watchify` command. For instance, if I wanted to watchify 
the file `login.js` which is located in `client/content/login`, and output a file in the static folder, I would run 
the following from the **root** directory:
```
watchify client/content/login/login.js -o client/static/login.js -v
```
Then, in the html file that I would like to use the `login.js` in, I would import the file stored in the **static** directory. 

NOTE: After you run the watchify command, it will hang and wait for any changes to `client/content/login/login.js` and update 
`client/static/login.js` if it notices them. If you stop the `watchify` program, and then update `client/content/login/login.js`, 
you will have to run `watchify` again.

You can install watchify via npm with:
```
npm i watchify
```

##### Running the Server Locally
After you have the repository cloned, navigate to the **server** subdirectory. You will need to install 
Flask in order to run the server locally. If you wish, you may use a Python virutal environment to manage 
dependenices so that they don't take up space on your machine. This is done by running:
```
python3 -m venv venv
source venv/bin/activate
```
Whether or not you've decided to use a virtual environment, the next step is to install Flask:
```
python -m pip install Flask==1.1.2
```
Then, from within the **server** subdirectory, start the server with the following command:
```
flask run
```
This will start the server on localhost port 5000. You can verify that the server is running correctly 
by going to the following address in your browser: <http://localhost:5000/>. 
You should see a message that says:
```
Hello from a Heroku server!
```
If you would like the app to reload every time you make a change, you can set an environment variable like so:
```
FLASK_ENV=development flask run
```

##### Accessing the Production Server
The production server is located at the following URL: <https://mashypass-app.herokuapp.com/>
You should be able to go to this link and see the same "Hello from a Heroku Server!" message.















