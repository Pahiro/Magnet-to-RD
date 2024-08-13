# Magnet Link to Real-Debrid (Auto-Select Specific Files)

## Description

This userscript automates the process of sending magnet links to Real-Debrid, checking for duplicates, and selecting specific file types (e.g., `.mp3`, `.m4b`, `.mp4`, `.mkv`, `.cbz`, `.cbr`) for download. It adds a "send" icon next to magnet links on web pages, allowing you to quickly and efficiently manage your torrent files with Real-Debrid. The original design was intended for TPB but it'll still add an RD icon wherever it finds a magnet link. 
Note: The main reason we're selecting files is that rar'ed torrents (torrents with multiple filetypes are compressed by RD, when specific files are selected, it's not) are still not working well with rclone and zurg. Note that I have found zurg to be a lot more responsive than rclone_rd. 

## Features

- **Automated Magnet Link Processing:** Automatically sends magnet links to Real-Debrid.
- **Duplicate Check:** Prevents adding duplicate torrents by checking if the torrent already exists.
- **File Type Filtering:** Selects only specified file types (e.g., `.mp3`, `.m4b`, `.mp4`, `.mkv`, `.cbz`, `.cbr`) from the torrent.
- **User Feedback:** Displays temporary messages to inform you about the status of the operation (e.g., success, failure, duplicates).

## Installation

1. **Install a Userscript Manager:** If you haven’t already, install a userscript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/) in your browser.
2. **Add the Script:**
   - Open the userscript manager dashboard.
   - Create a new script and copy the content from the `magnet-link-to-real-debrid.user.js` file into the editor.
   - Save the script.

## Configuration

1. **Replace `YOUR_REAL_DEBRID_API_KEY`:** Insert your Real-Debrid API key in the script where indicated.
2. **Adjust File Types (Optional):** Modify the `allowedExtensions` array if you want to include or exclude specific file types.

## Usage

- **Locate Magnet Links:** The script will automatically find magnet links on the web page you are visiting.
- **Send Magnet Links:** Click the "send" icon next to a magnet link to add it to Real-Debrid and select specific files based on their extensions.

## License

This script is provided as-is. Feel free to modify and use it according to your needs. No warranty is provided for its functionality.
