var s = document.createElement('script');
s.type = "module";
s.src = chrome.runtime.getURL('script.mjs');
(document.head||document.documentElement).appendChild(s);
s.onload = function() {
    s.parentNode.removeChild(s);
};

let submitButton = document.getElementById("submit-button");
    submitButton.addEventListener("click", () => {
        fetch(chrome.runtime.getURL('/modal.html')).then(r => r.text()).then(html => {
            document.body.insertAdjacentHTML('beforeend', html);
        })
        .then(() => {
            document.querySelector('.bg-modal').style.display = "inline-block";
            document.querySelector('.bg-modal').style.float = "right";

        })
        .then(() => {
            document.querySelector('.close').addEventListener("click", function() {
                document.querySelector('.bg-modal').style.display = "none";
            })
        });

    })