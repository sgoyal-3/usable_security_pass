function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
          

window.addEventListener('load', function() {
  console.log(document.cookie);
  var email = getCookie("email");
  console.log(email);
  document.getElementById("email").innerHTML = email.split('@')[0];
})



/*
* Send the user to the home page if they click the home link
*/
window.addEventListener('load', function() {
    let registerLink = document.getElementById("home-page");
    registerLink.addEventListener('click', function() {
        //redirect
        chrome.tabs.create({url: "html/home.html"});
    })

    let signOut = document.getElementById('sign-out');
    signOut.addEventListener('click', () => {
      document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
      window.location.replace('/html/popup.html')
    })
})