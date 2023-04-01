let OPENAI_ID = "YOUR OPEN_AI ID HERE"

function createTooltip() {
    var tooltip = document.createElement("div");
    tooltip.id = "quickgpt-tooltip";
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

document.addEventListener("mouseup", function (e) {
    var highlightedText = window.getSelection().toString();

    if (highlightedText.length > 30) {
        var xhr = new XMLHttpRequest();
        xhr.open(
            "POST",
            "https://api.openai.com/v1/chat/completions",
            true
        );
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader(
            "Authorization",
            "Bearer " + OPENAI_ID
        );
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var response = JSON.parse(xhr.responseText);
                var answer = response.choices[0].message.content.trim();

                var x = e.pageX;
                var y = e.pageY;
                showTooltip(tooltip, answer, x, y);
            }
        };
        var data = JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: highlightedText + "?" }],
            temperature: 0.7,
        });
        xhr.send(data);
    } else {
        hideTooltip(tooltip);
    }
});

document.addEventListener("mousedown", function () {
    hideTooltip(tooltip);
});
