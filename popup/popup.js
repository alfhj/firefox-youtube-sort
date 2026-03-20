document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  const errorContainer = document.getElementById('error-container');
  const errorTime = document.getElementById('error-time');
  const errorMsg = document.getElementById('error-msg');
  const errorCloseBtn = document.getElementById('error-close');

  // Load existing settings and potential errors
  browser.storage.local.get({
    apiKey: '',
    lastError: null
  }).then(items => {
    apiKeyInput.value = items.apiKey;

    if (items.lastError) {
      errorTime.textContent = items.lastError.timestamp + ' - ' + items.lastError.title;
      errorMsg.textContent = items.lastError.message;
      errorContainer.style.display = 'block';
    }
  });

  // Dismiss error
  errorCloseBtn.addEventListener('click', () => {
    browser.storage.local.remove('lastError').then(() => {
      errorContainer.style.display = 'none';
      browser.action.setBadgeText({ text: "" }); // Clear badge
    });
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    browser.storage.local.set({
      apiKey: apiKeyInput.value.trim()
    }).then(() => {
      statusDiv.textContent = 'Settings saved!';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
    }).catch(error => {
      statusDiv.textContent = 'Error saving settings.';
      statusDiv.style.color = 'red';
      console.error('Error saving settings:', error);
    });
  });
});
