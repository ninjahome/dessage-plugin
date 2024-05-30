// js/content.js
(function() {
    console.log("Content script loaded");

    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/inject.js');
    script.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
})();
