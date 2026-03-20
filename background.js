// background.js

function setStatus(state) {
  if (state === 'busy') {
    browser.action.setBadgeText({ text: "⏳" });
    browser.action.setBadgeBackgroundColor({ color: "#f39c12" });
  } else if (state === 'success') {
    browser.action.setBadgeText({ text: "✓" });
    browser.action.setBadgeBackgroundColor({ color: "#2ecc71" });
    setTimeout(() => browser.action.setBadgeText({ text: "" }), 3000);
  } else if (state === 'error') {
    browser.action.setBadgeText({ text: "!" });
    browser.action.setBadgeBackgroundColor({ color: "#e74c3c" });
    // Error badge is persistent until cleared via popup
  }
}

async function logError(title, message) {
  const timestamp = new Date().toLocaleTimeString();
  await browser.storage.local.set({
    lastError: { title, message, timestamp }
  });
  setStatus('error');
}

browser.runtime.onInstalled.addListener(async () => {
  await browser.contextMenus.removeAll();

  browser.contextMenus.create({
    id: "sort-parent",
    title: "Sort YouTube tabs",
    contexts: ["tab"],
    icons: {
      "16": "icons/icon.svg",
      "32": "icons/icon.svg"
    }
  });

  const categories = [
    { id: "title", title: "Title" },
    { id: "uploader", title: "Uploader" },
    { id: "date", title: "Date of Upload" },
    { id: "duration", title: "Duration" }
  ];

  categories.forEach(cat => {
    browser.contextMenus.create({
      id: `sort-${cat.id}`,
      parentId: "sort-parent",
      title: cat.title,
      contexts: ["tab"]
    });

    browser.contextMenus.create({
      id: `sort-${cat.id}-asc`,
      parentId: `sort-${cat.id}`,
      title: "Ascending",
      contexts: ["tab"]
    });

    browser.contextMenus.create({
      id: `sort-${cat.id}-desc`,
      parentId: `sort-${cat.id}`,
      title: "Descending",
      contexts: ["tab"]
    });
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith("sort-") && (info.menuItemId.endsWith("-asc") || info.menuItemId.endsWith("-desc"))) {
    try {
      const parts = info.menuItemId.split('-');
      const sortOrder = parts.pop();
      const sortBy = parts.pop();

      const highlightedTabs = await browser.tabs.query({ highlighted: true, windowId: tab.windowId });

      if (highlightedTabs.length <= 1) {
        return; // Do nothing if only one tab selected
      }

      setStatus('busy');
      await sortTabs(highlightedTabs, sortBy, sortOrder);
      setStatus('success');
    } catch (error) {
      console.error("Error sorting tabs:", error);
      logError("Sorting Error", error.message || "An unknown error occurred.");
    }
  }
});

// Parse ISO 8601 duration to seconds
function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

async function sortTabs(tabs, sortBy, sortOrder) {
  // 1. Get settings
  const settings = await browser.storage.local.get({
    apiKey: ''
  });
  settings.sortBy = sortBy;
  settings.sortOrder = sortOrder;

  // 2. Separate tabs into categories
  const youtubeVideoTabs = [];
  const youtubeOtherTabs = [];
  const nonYoutubeTabs = [];

  tabs.forEach(t => {
    try {
      const url = new URL(t.url);
      if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
        let videoId = null;
        if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1);
        } else if (url.pathname === '/watch' && url.searchParams.has('v')) {
          videoId = url.searchParams.get('v');
        } else if (url.pathname.startsWith('/shorts/')) {
          videoId = url.pathname.split('/')[2];
        }

        if (videoId) {
          youtubeVideoTabs.push({ tab: t, videoId: videoId, metadata: null });
        } else {
          youtubeOtherTabs.push(t);
        }
      } else {
        nonYoutubeTabs.push(t);
      }
    } catch (e) {
      // Invalid URL (e.g. about:blank), treat as non-youtube
      nonYoutubeTabs.push(t);
    }
  });

  // 3. Fetch missing metadata if sorting by API fields
  if (settings.sortBy !== 'title' && youtubeVideoTabs.length > 0) {
    if (!settings.apiKey) {
      console.warn("API Key missing, cannot sort by " + settings.sortBy);
      const errDivMsg = "You need to add a YouTube API Key in settings to sort by " + settings.sortBy + ".";
      logError("Missing API Key", errDivMsg);
      throw new Error(errDivMsg);
    } else {
      const cacheKeys = youtubeVideoTabs.map(v => 'yt_vid_' + v.videoId);
      const cachedData = await browser.storage.local.get(cacheKeys);

      const missingIds = [];
      youtubeVideoTabs.forEach(v => {
        const cacheKey = 'yt_vid_' + v.videoId;
        if (cachedData[cacheKey]) {
          v.metadata = cachedData[cacheKey];
        } else {
          missingIds.push(v.videoId);
        }
      });

      if (missingIds.length > 0) {
        // Fetch in chunks of 50 (API limit)
        for (let i = 0; i < missingIds.length; i += 50) {
          const chunk = missingIds.slice(i, i + 50);
          try {
            const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${chunk.join(',')}&key=${settings.apiKey}`;
            const response = await fetch(apiUrl);
            if (response.ok) {
              const data = await response.json();
              const toCache = {};

              data.items.forEach(item => {
                const meta = {
                  uploader: item.snippet.channelTitle,
                  date: item.snippet.publishedAt,
                  duration: parseDuration(item.contentDetails.duration)
                };
                toCache['yt_vid_' + item.id] = meta;

                // Update in memory representation
                const vt = youtubeVideoTabs.find(v => v.videoId === item.id);
                if (vt) vt.metadata = meta;
              });

              await browser.storage.local.set(toCache);
            } else {
              console.error("YouTube API fetching failed", response.status);
              logError("YouTube API Error", "API returned status: " + response.status);
              throw new Error("YouTube API Fetch Failed");
            }
          } catch (e) {
            console.error("YouTube API fetch error", e);
            throw e;
          }
        }
      }
    }
  }

  // 4. Sort Youtube Video Tabs
  youtubeVideoTabs.sort((a, b) => {
    let valA, valB;

    if (settings.sortBy === 'title') {
      valA = a.tab.title.toLowerCase();
      valB = b.tab.title.toLowerCase();
    } else {
      // If metadata is missing, default to empty string or 0 to keep them at the end or beginning
      valA = a.metadata ? a.metadata[settings.sortBy] : (settings.sortBy === 'duration' ? 0 : "");
      valB = b.metadata ? b.metadata[settings.sortBy] : (settings.sortBy === 'duration' ? 0 : "");

      if (settings.sortBy === 'uploader') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      } else if (settings.sortBy === 'date') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
    }

    let comparison = 0;
    if (valA < valB) {
      comparison = -1;
    } else if (valA > valB) {
      comparison = 1;
    }

    if (comparison !== 0) {
      return settings.sortOrder === 'asc' ? comparison : -comparison;
    }

    // Stable sort fallback: original original index
    return a.tab.index - b.tab.index;
  });

  // 5. Combine and Move Tabs
  const allReorderedTabs = [
    ...youtubeVideoTabs.map(v => v.tab),
    ...youtubeOtherTabs,
    ...nonYoutubeTabs
  ];

  // The tabs will be placed as a contiguous block starting from the minimum index among the selected tabs.
  const minIndex = Math.min(...tabs.map(t => t.index));
  const tabIdsToMove = allReorderedTabs.map(t => t.id);

  await browser.tabs.move(tabIdsToMove, { index: minIndex });
}
