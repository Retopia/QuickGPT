let OPENAI_ID = "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";

function loadTesseractWorker() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js/dist/tesseract.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Tesseract worker script'));
        document.head.appendChild(script);
    });
}

loadTesseractWorker().then(() => {
    console.log('Tesseract worker script loaded');
}).catch((error) => {
    console.error('Failed to load Tesseract worker script:', error);
});

function setInitialMode() {
    chrome.storage.local.get("pictureMode", ({ pictureMode }) => {
        mode = pictureMode ? "picture" : "highlight";
        document.body.style.cursor = pictureMode ? "crosshair" : "auto";
    });
}

setInitialMode(); // Call this function when the content script is initialized.


function createTooltip() {
    var tooltip = document.createElement("div");
    tooltip.id = "cheatgpt-tooltip";
    tooltip.style.display = "none";
    document.body.appendChild(tooltip);
    return tooltip;
}

function showTooltip(tooltip, text, x, y) {
    tooltip.innerHTML = text;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.style.display = "block";
}

function hideTooltip(tooltip) {
    tooltip.style.display = "none";
}

var tooltip = createTooltip();

function createSelectionRectangle() {
    var rect = document.createElement("div");
    rect.id = "cheatgpt-selection-rect";
    rect.style.display = "none";
    rect.style.position = "absolute";
    rect.style.zIndex = 9998;
    rect.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
    rect.style.border = "1px dashed #000";
    document.body.appendChild(rect);
    return rect;
}

var selectionRectangle = createSelectionRectangle();

// Picture mode implementation
function captureAndRecognizeText(x, y, width, height, pageX, pageY, scrollX, scrollY) {
    chrome.runtime.sendMessage({ action: "captureVisibleTab", params: { x, y, width, height, clientX: pageX, clientY: pageY, scrollX, scrollY } }, ({ dataUrl }) => {
        console.log('dataUrl:', dataUrl);

        Tesseract.recognize(dataUrl, "eng", { logger: (m) => console.log(m) })
            .then(({ data: { text } }) => {
                console.log('Recognized text:', text); // Print recognized text
                if (text.length > 30) {
                    getAnswerFromGPT(text, pageX, pageY);
                } else {
                    hideTooltip(tooltip);
                }
            })
            .catch((error) => {
                console.error("Error during OCR:", error);
                hideTooltip(tooltip);
            });
    });
}

function getAnswerFromGPT(prompt, x, y) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.openai.com/v1/chat/completions", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader(
        "Authorization",
        "Bearer " + OPENAI_ID
    );
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var response = JSON.parse(xhr.responseText);
            var answer = response.choices[0].message.content.trim();

            showTooltip(tooltip, answer, x, y);
        }
    };
    var data = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
    });
    xhr.send(data);
}

let mode = "highlight"; // Default mode

function togglePictureMode() {
    if (mode === "highlight") {
        mode = "picture";
        document.body.style.cursor = "crosshair";
    } else {
        mode = "highlight";
        document.body.style.cursor = "auto";
    }
}

document.addEventListener("mousedown", function (e) {
    if (mode === "picture") {
        selectionRectangle.style.display = "block";
        selectionRectangle.style.left = e.pageX + "px";
        selectionRectangle.style.top = e.pageY + "px";
        selectionRectangle.style.width = "0px";
        selectionRectangle.style.height = "0px";
    }

    hideTooltip(tooltip);
});

document.addEventListener("mousemove", function (e) {
    if (mode === "picture" && selectionRectangle.style.display === "block") {
        const startX = parseInt(selectionRectangle.style.left);
        const startY = parseInt(selectionRectangle.style.top);

        selectionRectangle.style.width = Math.abs(e.pageX - startX) + "px";
        selectionRectangle.style.height = Math.abs(e.pageY - startY) + "px";

        if (e.pageX < startX) {
            selectionRectangle.style.left = e.pageX + "px";
        }

        if (e.pageY < startY) {
            selectionRectangle.style.top = e.pageY + "px";
        }
    }
});

document.addEventListener("mouseup", function (e) {
    if (mode === "highlight") {
        var highlightedText = window.getSelection().toString();

        if (highlightedText.length > 30) {
            getAnswerFromGPT(highlightedText, e.clientX, e.clientY);
        } else {
            hideTooltip(tooltip);
        }
    } else if (mode === "picture") {
        const rectWidth = parseInt(selectionRectangle.style.width);
        const rectHeight = parseInt(selectionRectangle.style.height);

        if (rectWidth >= 30 && rectHeight >= 30) {
            captureAndRecognizeText(
                parseInt(selectionRectangle.style.left),
                parseInt(selectionRectangle.style.top),
                parseInt(selectionRectangle.style.width),
                parseInt(selectionRectangle.style.height),
                e.pageX,
                e.pageY,
                window.scrollX,
                window.scrollY
            );
        }

        selectionRectangle.style.display = "none";
    }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "togglePictureMode") {
        togglePictureMode();
    }
});