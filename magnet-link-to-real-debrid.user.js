// ==UserScript==
// @name         Magnet Link to Real-Debrid
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Automatically send magnet links to Real-Debrid, check for duplicates, and select specific file types
// @author       Pahiro
// @match        *://nyaa.si/*
// @match        *://*.nyaa.si/*
// @grant        GM_xmlhttpRequest
// @connect      api.real-debrid.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const apiKey = 'YOUR_REAL_DEBRID_API_KEY_HERE'; // Replace with your Real-Debrid API key
    const allowedExtensions = ['mp3', 'm4b', 'mp4', 'mkv', 'cbz', 'cbr', 'MKV'];

    let existingTorrents = [];

    // Wrapper for GM_xmlhttpRequest to work like fetch
    function gmFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: url,
                headers: options.headers || {},
                data: options.body || null,
                onload: (response) => {
                    resolve({
                        ok: response.status >= 200 && response.status < 300,
                        status: response.status,
                        json: async () => JSON.parse(response.responseText)
                    });
                },
                onerror: (error) => {
                    reject(error);
                }
            });
        });
    }

    // Function to get the hash from a magnet link
    function getMagnetHash(magnetLink) {
        const match = magnetLink.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
        return match ? match[1].toUpperCase() : null;
    }

    // Function to fetch the list of existing torrents from Real-Debrid
    async function fetchExistingTorrents() {
        if (!apiKey) {
            console.warn('No API key configured');
            return;
        }

        try {
            const response = await gmFetch('https://api.real-debrid.com/rest/1.0/torrents', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            existingTorrents = await response.json();
            console.log('Fetched existing torrents:', existingTorrents.length);
        } catch (error) {
            console.error('Error fetching torrents from Real-Debrid:', error);
        }
    }

    // Function to check if a torrent already exists in Real-Debrid
    function isTorrentInList(magnetHash) {
        return existingTorrents.some(torrent => torrent.hash.toUpperCase() === magnetHash);
    }

    async function sendToRealDebrid(magnetLink, icon) {
        if (!apiKey) {
            showTemporaryMessage('Please configure your API key in the script!', 'red');
            return;
        }

        try {
            const magnetHash = getMagnetHash(magnetLink);

            if (!magnetHash) {
                showTemporaryMessage('Invalid magnet link.', 'red');
                return;
            }

            if (isTorrentInList(magnetHash)) {
                showTemporaryMessage('Torrent already exists in Real-Debrid.', 'orange');
                icon.style.filter = 'invert(18%) sepia(88%) saturate(7485%) hue-rotate(357deg) brightness(103%) contrast(105%)';
                return;
            }

            showTemporaryMessage('Adding to Real-Debrid...', 'blue');

            // Step 1: Add the magnet link to Real-Debrid
            const addMagnetResponse = await gmFetch('https://api.real-debrid.com/rest/1.0/torrents/addMagnet', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    'magnet': magnetLink
                }).toString()
            });
            const addMagnetData = await addMagnetResponse.json();
            const torrentId = addMagnetData.id;

            // Step 2: Retrieve the list of files in the torrent
            const torrentInfoResponse = await gmFetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
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
                await gmFetch(`https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        'files': selectedFiles
                    }).toString()
                });

                showTemporaryMessage('Magnet link added and files selected!', 'green');
                icon.style.filter = 'invert(18%) sepia(88%) saturate(7485%) hue-rotate(357deg) brightness(103%) contrast(105%)';

                // Refresh the torrent list
                await fetchExistingTorrents();
            } else {
                showTemporaryMessage('No files matched the selected extensions.', 'red');
            }
        } catch (error) {
            console.error('Error:', error);
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
        msgDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        document.body.appendChild(msgDiv);

        setTimeout(() => {
            msgDiv.remove();
        }, 3000);
    }

    // Function to create a send icon next to the magnet link
    function createSendIcon(link) {
        // Check if icon already exists
        if (link.nextSibling && link.nextSibling.classList && link.nextSibling.classList.contains('rd-icon')) {
            return;
        }

        const icon = document.createElement('img');
        icon.src = 'https://fcdn.real-debrid.com/0830/favicons/favicon.ico';
        icon.className = 'rd-icon';
        icon.style.cursor = 'pointer';
        icon.style.marginLeft = '5px';
        icon.style.width = '16px';
        icon.style.height = '16px';
        icon.style.verticalAlign = 'middle';
        icon.style.display = 'inline-block';

        const magnetHash = getMagnetHash(link.href);
        if (magnetHash && isTorrentInList(magnetHash)) {
            icon.style.filter = 'invert(18%) sepia(88%) saturate(7485%) hue-rotate(357deg) brightness(103%) contrast(105%)';
            icon.title = 'Already in Real-Debrid';
        } else {
            icon.title = 'Send to Real-Debrid';
        }

        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            sendToRealDebrid(link.href, icon);
        });

        // Insert after the link
        if (link.nextSibling) {
            link.parentNode.insertBefore(icon, link.nextSibling);
        } else {
            link.parentNode.appendChild(icon);
        }
    }

    // Process magnet links
    function processMagnetLinks() {
        const magnetLinks = document.querySelectorAll('a[href^="magnet:"]');
        console.log(`Found ${magnetLinks.length} magnet links on page`);
        magnetLinks.forEach(createSendIcon);
    }

    // Observer to watch for dynamically added magnet links
    function observeForMagnetLinks() {
        const observer = new MutationObserver((mutations) => {
            const magnetLinks = document.querySelectorAll('a[href^="magnet:"]:not(.rd-processed)');
            if (magnetLinks.length > 0) {
                magnetLinks.forEach(link => {
                    link.classList.add('rd-processed');
                    createSendIcon(link);
                });
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async function main() {
        console.log('Real-Debrid userscript initialized');

        // Fetch existing torrents first
        if (apiKey) {
            await fetchExistingTorrents();
        }

        // Process existing magnet links
        processMagnetLinks();

        // Watch for dynamically added links
        observeForMagnetLinks();
    }

    // Run the script
    main();

})();
