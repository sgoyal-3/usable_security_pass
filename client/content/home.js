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