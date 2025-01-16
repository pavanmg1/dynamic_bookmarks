const CONFIG_URL_STORAGE_KEY = "configUrl";
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);

function saveOptions() {
  const configUrl = document.getElementById('configUrl').value;
  chrome.storage.sync.set({ [CONFIG_URL_STORAGE_KEY]: configUrl }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  });
}

function restoreOptions() {
  chrome.storage.sync.get([CONFIG_URL_STORAGE_KEY], (items) => {
    document.getElementById('configUrl').value = items[CONFIG_URL_STORAGE_KEY] || "";
  });
}