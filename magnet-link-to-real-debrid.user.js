// ==UserScript==
// @name         Magnet Link to Real-Debrid
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Automatically send magnet links to Real-Debrid, check for duplicates, and select specific file types
// @author       Pahiro
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const apiKey = 'YOUR_REAL_DEBRID_API_KEY'; // Replace with your Real-Debrid API key
    const allowedExtensions = ['mp3', 'm4b', 'mp4', 'mkv', 'cbz', 'cbr'];

    let existingTorrents = [];

    // Function to get the hash from a magnet link
    function getMagnetHash(magnetLink) {
        const magnetUri = new URL(magnetLink);
        const hashParam = magnetUri.searchParams.get('xt');
        return hashParam ? hashParam.split(':').pop().toUpperCase() : null;
    }

    // Function to fetch the list of existing torrents from Real-Debrid
    async function fetchExistingTorrents() {
        try {
            const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            existingTorrents = await response.json();
            console.log('Fetched existing torrents:', existingTorrents); // Debugging statement
        } catch (error) {
            console.error('Error fetching torrents from Real-Debrid:', error);
        }
    }

    // Function to check if a torrent already exists in Real-Debrid
    function isTorrentInList(magnetHash) {
        return existingTorrents.some(torrent => torrent.hash.toUpperCase() === magnetHash);
    }

    // Function to send a magnet link to Real-Debrid and select specific file types
    async function sendToRealDebrid(magnetLink, icon) {
        try {
            const magnetHash = getMagnetHash(magnetLink);

            if (!magnetHash) {
                showTemporaryMessage('Invalid magnet link.', 'red');
                return;
            }

            if (isTorrentInList(magnetHash)) {
                showTemporaryMessage('Torrent already exists in Real-Debrid.', 'red');
                icon.style.filter = 'hue-rotate(0deg)'; // Recolor icon to red
                return;
            }

            // Step 1: Add the magnet link to Real-Debrid
            const addMagnetResponse = await fetch('https://api.real-debrid.com/rest/1.0/torrents/addMagnet', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ 'magnet': magnetLink })
            });
            const addMagnetData = await addMagnetResponse.json();
            const torrentId = addMagnetData.id;

            // Step 2: Retrieve the list of files in the torrent
            const torrentInfoResponse = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            const torrentInfoData = await torrentInfoResponse.json();
            const files = torrentInfoData.files;

            // Step 3: Filter the files by specific extensions
            const selectedFiles = files
                .filter(file => allowedExtensions.includes(file.path.split('.').pop().toLowerCase()))
                .map(file => file.id)
                .join(',');

            // Step 4: Select the filtered files in the torrent
            if (selectedFiles.length > 0) {
                await fetch(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({ 'files': selectedFiles })
                });

                showTemporaryMessage('Magnet link added and files selected in Real-Debrid!', 'green');
                icon.style.filter = 'invert(18%) sepia(88%) saturate(7485%) hue-rotate(357deg) brightness(103%) contrast(105%)';
            } else {
                showTemporaryMessage('No files matched the selected extensions.', 'red');
            }
        } catch (error) {
            console.error('Error processing magnet link:', error);
            showTemporaryMessage('Failed to send magnet link to Real-Debrid.', 'red');
        }
    }

    // Function to show a temporary message
    function showTemporaryMessage(message, color) {
        const msgDiv = document.createElement('div');
        msgDiv.textContent = message;
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '20px';
        msgDiv.style.left = '20px';
        msgDiv.style.backgroundColor = color;
        msgDiv.style.color = 'white';
        msgDiv.style.padding = '10px';
        msgDiv.style.borderRadius = '5px';
        msgDiv.style.zIndex = 10000;
        document.body.appendChild(msgDiv);

        // Automatically remove the message after 3 seconds
        setTimeout(() => {
            msgDiv.remove();
        }, 3000);
    }

    // Function to create a send icon next to the magnet link
    function createSendIcon(link) {
        const icon = document.createElement('img');
        icon.src = 'https://fcdn.real-debrid.com/0830/favicons/favicon.ico'; // Real-Debrid icon
        icon.style.cursor = 'pointer';
        icon.style.marginLeft = '5px';
        icon.style.width = '16px';
        icon.style.height = '16px';

        const magnetHash = getMagnetHash(link.href);
        if (magnetHash && isTorrentInList(magnetHash)) {
          	icon.style.filter = 'invert(18%) sepia(88%) saturate(7485%) hue-rotate(357deg) brightness(103%) contrast(105%)';
            // icon.style.filter = 'hue-rotate(60deg)'; // Recolor icon to red if torrent exists
            console.log("Recolored icon for duplicate torrent:", link.href); // Debug statement
        }

        icon.addEventListener('click', () => {
            sendToRealDebrid(link.href, icon);
            console.log("Icon clicked for:", link.href); // Debug statement
        });

        link.parentNode.insertBefore(icon, link.nextSibling);
    }

    // Main function to run on page load
    async function main() {
        await fetchExistingTorrents();
        document.querySelectorAll('a[href*="magnet:"]').forEach(createSendIcon);
    }

    main(); // Call the main function
})();
