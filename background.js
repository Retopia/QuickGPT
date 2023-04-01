chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'captureVisibleTab') {
        const { x, y, width, height, clientX, clientY } = request.params;

        chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }

            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                setTimeout(() => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, x + window.scrollX, y + window.scrollY, width, height, 0, 0, width, height);
                    const croppedDataUrl = canvas.toDataURL();
                    sendResponse({ dataUrl: croppedDataUrl, clientX, clientY });
                }, 100);
            };
        });
        return true;
    }
});