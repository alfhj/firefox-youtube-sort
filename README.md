# YouTube Tab Sorter

A Firefox extension that sorts your selected YouTube tabs by title, uploader, upload date, or duration. Non-YouTube tabs are neatly placed at the end.

## Features
- **Context Menu Integration**: Just right-click on any selected tab and choose "Sort YouTube tabs".
- **No API Quota for Titles**: Sorting by title relies entirely on tab metadata.
- **Indefinite Local Caching**: Minimizes YouTube API quota usage by saving video metadata indefinitely.
- **Stable Sort**: Fallbacks to your original tab order for ties.

## Installation

### Temporary Installation (for Development/Testing)
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file in this repository.

### Hosting / Distribution
To permanently host or install this extension:
1. Zip the extension files (`manifest.json`, `background.js`, `popup/`).
2. Go to the [Mozilla Add-ons Developer Hub (AMO)](https://addons.mozilla.org/en-US/developers/).
3. Submit the zip file as either a Listed (public on AMO) or Unlisted (self-distributed) add-on.

## Usage
1. Click the extension icon in your toolbar to open the settings.
2. Enter your **YouTube Data API v3 Key**. ([Click here for a guide on how to get one](https://developers.google.com/youtube/v3/getting-started)).
   *Note: Without an API key, you can only sort by Title.*
3. Select multiple tabs in Firefox (using `Ctrl`-click or `Shift`-click).
4. Right-click on one of the selected tabs, navigate to **Sort YouTube tabs**, choose your metric (e.g., Title, Uploader), and select **Ascending** or **Descending**.