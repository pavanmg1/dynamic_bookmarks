const CONFIG_URL_STORAGE_KEY = 'configUrl';
const LAST_UPDATE_STORAGE_KEY = 'lastUpdateTime';
const DEFAULT_CONFIG_URL = 'http://13.213.133.131:4001/api/bookmarks';

function getConfigUrl() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([CONFIG_URL_STORAGE_KEY], (result) => {
      const configUrl = result[CONFIG_URL_STORAGE_KEY] || DEFAULT_CONFIG_URL;
      resolve(configUrl);
    });
  });
}

async function updateBookmarks() {
  try {
    const configUrl = await getConfigUrl();
    if (!configUrl) {
      console.warn('Please set config url in options page');
      chrome.action.setBadgeText({ text: 'ERR' });
      chrome.action.setBadgeBackgroundColor({ color: 'red' });
      return;
    }
    chrome.action.setBadgeText({ text: '...' });
    chrome.action.setBadgeBackgroundColor({ color: 'blue' });
    const response = await fetch(configUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const bookmarks = (await response.json()) || [];
    // Iterate through each environment in the config
    for (const item of bookmarks) {
      const area = item.area;
      // Create a folder for the current area
      const folder = await ensureBookmarkFolder(area);
      for (const urlKey in item.urls) {
        const url = item.urls[urlKey];
        // Create the bookmark object
        const bookmark = {
          title: urlKey + '_' + area,
          url: url,
          parentId: folder.id
        };
        await createOrUpdateBookmark(bookmark);
      }
    }
    await chrome.storage.local.set({ [LAST_UPDATE_STORAGE_KEY]: Date.now() });
    chrome.action.setBadgeText({ text: '' });
  } catch (error) {
    console.error('Error updating bookmarks:', error);
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: 'red' });
  }
}

async function ensureBookmarkFolder(folderName) {
  return new Promise((resolve) => {
    chrome.bookmarks.search({ title: folderName }, (results) => {
      if (results.length > 0) {
        resolve(results[0]);
      } else {
        chrome.bookmarks.create({ title: folderName }, resolve);
      }
    });
  });
}

async function createOrUpdateBookmark(bookmark) {
  const query = { title: bookmark.title };
  try {
    const results = await chrome.bookmarks.search(query);
    if (results.length === 0) {
      // No matching bookmark found, create a new one
      await chrome.bookmarks.create(bookmark);
    } else {
      // Update the existing bookmark (implement your update logic)
      await chrome.bookmarks.update(results[0].id, { url: bookmark.url });
    }
  } catch (error) {
    console.error('Error searching bookmarks:', error);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === 'updateBookmarks') {
    updateBookmarks()
      .then(() => sendResponse({ status: 'completed' }))
      .catch(() => sendResponse({ status: 'failed' }));
    return true;
  }
});

// Set up alarm for periodic updates
chrome.alarms.create('bookmarkUpdateAlarm', { periodInMinutes: 5 }); // Update every 5 minutes

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'bookmarkUpdateAlarm') {
    updateBookmarks();
  }
});

// Update on install/update
chrome.runtime.onInstalled.addListener(() => {
  updateBookmarks();
});
