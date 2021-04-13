var s = document.createElement('script');
s.type = "module";
s.src = chrome.runtime.getURL('script.mjs');
(document.head||document.documentElement).appendChild(s);
s.onload = function() {
    s.parentNode.removeChild(s);
};