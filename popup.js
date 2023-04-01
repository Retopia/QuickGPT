document.getElementById("modeToggle").addEventListener("change", (e) => {
    chrome.storage.local.set({ pictureMode: e.target.checked });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "togglePictureMode" });
    });
});

chrome.storage.local.get("pictureMode", ({ pictureMode }) => {
    document.getElementById("modeToggle").checked = !!pictureMode;
});