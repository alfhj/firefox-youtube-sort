# YouTube Tab Sort

A Firefox extension that sorts your selected YouTube tabs by title, uploader, upload date, or duration.

## Installation

### Temporary Installation (for Development/Testing)
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file in this repository.

## Usage
1. Click the extension icon in your toolbar to open the settings.
2. Enter your **YouTube Data API v3 Key**. ([Click here for a guide on how to get one](https://developers.google.com/youtube/v3/getting-started)).
   *Note: Without an API key, you can only sort by Title.*
3. Select multiple tabs in Firefox (using `Ctrl`-click or `Shift`-click).
4. Right-click on one of the selected tabs, navigate to **Sort YouTube tabs**, choose your metric (e.g., Title, Uploader), and select **Ascending** or **Descending**.