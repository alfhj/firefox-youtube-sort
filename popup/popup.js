document.addEventListener("DOMContentLoaded", () => {
  const versionSpan = document.getElementById("version");
  if (versionSpan) {
    versionSpan.textContent = "v" + browser.runtime.getManifest().version;
  }

  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  const errorContainer = document.getElementById("error-container");
  const errorTime = document.getElementById("error-time");
  const errorMsg = document.getElementById("error-msg");
  const errorCloseBtn = document.getElementById("error-close");

  // Load existing settings and potential errors
  browser.storage.local
    .get({
      apiKey: "",
      lastError: null,
      sortPrefs: { sortBy: "title", sortOrder: "asc" },
    })
    .then((items) => {
      apiKeyInput.value = items.apiKey;
      sortBySelect.value = items.sortPrefs.sortBy;
      sortOrderSelect.value = items.sortPrefs.sortOrder;
      updateSortAndGroupVisibility();

      if (items.lastError) {
        errorTime.textContent = items.lastError.timestamp + " - " + items.lastError.title;
        errorMsg.textContent = items.lastError.message;
        errorContainer.style.display = "block";
      }
    });

  // Dismiss error
  errorCloseBtn.addEventListener("click", () => {
    browser.storage.local.remove("lastError").then(() => {
      errorContainer.style.display = "none";
      browser.action.setBadgeText({ text: "" }); // Clear badge
    });
  });

  // Sort all tabs in current window
  const sortAllBtn = document.getElementById("sortAllBtn");
  const sortAndGroupBtn = document.getElementById("sortAndGroupBtn");
  const sortBySelect = document.getElementById("sortBy");
  const sortOrderSelect = document.getElementById("sortOrder");
  const sortStatus = document.getElementById("sortStatus");

  function saveSortPrefs() {
    browser.storage.local.set({
      sortPrefs: { sortBy: sortBySelect.value, sortOrder: sortOrderSelect.value },
    });
  }

  function updateSortAndGroupVisibility() {
    sortAndGroupBtn.hidden = sortBySelect.value !== "uploader";
  }

  sortBySelect.addEventListener("change", () => {
    saveSortPrefs();
    updateSortAndGroupVisibility();
  });
  sortOrderSelect.addEventListener("change", saveSortPrefs);

  sortAllBtn.addEventListener("click", () => {
    const sortBy = sortBySelect.value;
    const sortOrder = sortOrderSelect.value;

    saveSortPrefs();

    sortStatus.textContent = "Sorting...";

    browser.runtime
      .sendMessage({
        action: "sortAllTabs",
        sortBy: sortBy,
        sortOrder: sortOrder,
      })
      .then(() => {
        sortStatus.textContent = "Tabs sorted!";
        setTimeout(() => {
          sortStatus.textContent = "";
        }, 2000);
      })
      .catch((error) => {
        sortStatus.textContent = "Error: " + error.message;
        sortStatus.style.color = "red";
      });
  });

  sortAndGroupBtn.addEventListener("click", () => {
    const sortOrder = sortOrderSelect.value;

    saveSortPrefs();

    sortStatus.textContent = "Sorting and grouping...";

    browser.runtime
      .sendMessage({
        action: "sortAndGroupTabs",
        sortOrder: sortOrder,
      })
      .then(() => {
        sortStatus.textContent = "Tabs sorted and grouped!";
        setTimeout(() => {
          sortStatus.textContent = "";
        }, 2000);
      })
      .catch((error) => {
        sortStatus.textContent = "Error: " + error.message;
        sortStatus.style.color = "red";
      });
  });

  // Save settings
  saveBtn.addEventListener("click", () => {
    browser.storage.local
      .set({
        apiKey: apiKeyInput.value.trim(),
      })
      .then(() => {
        statusDiv.textContent = "Settings saved!";
        setTimeout(() => {
          statusDiv.textContent = "";
        }, 2000);
      })
      .catch((error) => {
        statusDiv.textContent = "Error saving settings.";
        statusDiv.style.color = "red";
        console.error("Error saving settings:", error);
      });
  });
});
