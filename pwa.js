if(typeof navigator.serviceWorker !== "undefined") {
    window.addEventListener("load", function() {
        navigator.serviceWorker.register("workerbee.js").then(reg => { console.log(reg); });
    });
}

let deferredInstallPrompt = null;
const $section = $("#liInstallPWA");
$("#btnInstallPWA").on("click", installPWA);

window.addEventListener("beforeinstallprompt", saveBeforeInstallPromptEvent);
function saveBeforeInstallPromptEvent(e) {
    deferredInstallPrompt = e;
    $section.show();
}

function installPWA() {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(choice => {
        if (choice.outcome === "accepted") {
            ShowAlert("App Installed", "cool nice.");
            $section.hide();
        } else {
            ShowAlert("App Not Installed", "Why'd you click the button if you didn't wanty install it?");
        }
        deferredInstallPrompt = null;
    });
}