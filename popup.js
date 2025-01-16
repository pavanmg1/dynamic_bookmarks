document.getElementById('refreshButton').addEventListener('click', () => {
    chrome.runtime.sendMessage({ message: "updateBookmarks" }, function(response) {
        if (chrome.runtime.lastError) {
            console.error("Error sending message:", chrome.runtime.lastError.message); // Log the error message
            if (chrome.runtime.lastError.message === "Could not establish connection. Receiving end does not exist.") {
                console.warn("Service worker may be inactive. Trying again in a short while...");
                setTimeout(() => {
                    chrome.runtime.sendMessage({ message: "updateBookmarks" }, function(retryResponse) {
                        if (chrome.runtime.lastError) {
                            console.error("Retry failed:", chrome.runtime.lastError.message);
                        } else if (retryResponse && retryResponse.status === "completed") {
                            console.log("Update completed after retry.");
                        } else {
                            console.log("Update failed after retry or no response.");
                        }
                    });
                }, 500); // Retry after 500ms
            }
            return; // Important: Exit the function if there's an error
        }

        if (response && response.status === "completed") {
            console.log("Update completed.");
        } else {
            console.log("Update failed or no response.");
        }
    });
});

function updateLastUpdateTime() {
    chrome.storage.local.get(["lastUpdateTime"], (result) => {
        const lastUpdateTime = result.lastUpdateTime;
        if (lastUpdateTime) {
            const date = new Date(lastUpdateTime);
            document.getElementById("lastUpdate").textContent = `Last Updated: ${date.toLocaleString()}`;
        }
    });
}

updateLastUpdateTime();

chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.lastUpdateTime) {
        updateLastUpdateTime();
    }
});