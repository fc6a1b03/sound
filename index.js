        let currentSong = null;
        let selectedQuality = null;
        let selectedMID = null;

        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                searchSongs();
            }
        }

        function openSettingsModal() {
            document.getElementById('settings-modal').classList.remove('hidden');
        }

        function closeSettingsModal() {
            document.getElementById('settings-modal').classList.add('hidden');
        }

        function saveSettings() {
            const defaultPlayQuality = document.getElementById('default-play-quality').value;
            const defaultDownloadQuality = document.getElementById('default-download-quality').value;

            localStorage.setItem('defaultPlayQuality', defaultPlayQuality);
            localStorage.setItem('defaultDownloadQuality', defaultDownloadQuality);

            closeSettingsModal();
        }

        function loadSettings() {
            const defaultPlayQuality = localStorage.getItem('defaultPlayQuality') || '4';
            const defaultDownloadQuality = localStorage.getItem('defaultDownloadQuality') || '4';

            document.getElementById('default-play-quality').value = defaultPlayQuality;
            document.getElementById('default-download-quality').value = defaultDownloadQuality;
        }

        function openDownloadModal(mid) {
            selectedMID = mid;
            document.getElementById('custom-quality').value = '';
            document.getElementById('download-modal').classList.remove('hidden');

            const defaultDownloadQuality = document.getElementById('default-download-quality').value;
            const qualityRadios = document.querySelectorAll('input[name="download-quality"]');
            qualityRadios.forEach(radio => {
                if (radio.value === defaultDownloadQuality) {
                    radio.checked = true;
                }
            });

            qualityRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    if (radio.checked) {
                        document.getElementById('custom-quality').value = '';
                    }
                });
            });

            document.getElementById('custom-quality').addEventListener('input', () => {
                qualityRadios.forEach(radio => {
                    radio.checked = false;
                });
            });
        }

        function closeDownloadModal() {
            document.getElementById('download-modal').classList.add('hidden');
        }

        function downloadSelectedQuality() {
            const qualityRadios = document.querySelectorAll('input[name="download-quality"]');
            let quality = null;
            for (const radio of qualityRadios) {
                if (radio.checked) {
                    quality = radio.value;
                    break;
                }
            }
            const customQuality = document.getElementById('custom-quality').value;
            if (customQuality && customQuality >= 1 && customQuality <= 14) {
                quality = customQuality;
            }
            if (quality) {
                downloadSong(selectedMID, quality);
            } else {
                alert('请选择或输入有效的音质级别。');
            }
            closeDownloadModal();
        }

        function searchSongs() {
            const searchType = document.getElementById('search-type').value;
            const keyword = document.getElementById('search-input').value;
            let url;

            if (!keyword) return;

            if (searchType === 'keyword') {
                url = `https://api.lolimi.cn/API/qqdg/?word=${encodeURIComponent(keyword)}`;
            } else if (searchType === 'mid') {
                url = `https://api.lolimi.cn/API/qqdg/?mid=${encodeURIComponent(keyword)}&p=4`;
            }

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        displaySongs(data.data, keyword);
                    } else {
                        alert('搜索失败，请重试。');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('搜索失败，请重试。');
                });
        }

        function displaySongs(songs, keyword) {
            const songList = document.getElementById('song-list');
            songList.innerHTML = '';

            const createSongItem = (song, mid) => {
                const songItem = document.createElement('div');
                songItem.className = 'bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex gap-4';
                songItem.innerHTML = `
                    <img src="${song.cover}" alt="${song.song}" class="w-24 h-24 rounded-md object-cover">
                    <div class="flex-1 min-w-0">
                        <div class="font-medium mb-1 truncate">${song.song} - ${song.singer}</div>
<div class="text-sm text-zinc-400 mb-1 truncate">专辑: ${song.album}</div>
                        <div class="text-sm text-zinc-400 flex items-center gap-2">
                            MID: ${mid}
                            <button onclick="copyMID('${mid}', this)" class="px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 transition-colors">
                                复制
                            </button>
                        </div>
                        <div class="flex gap-2 mt-3">
                            <button onclick="playSong('${mid}')" class="px-3 h-8 rounded bg-zinc-200 text-zinc-900 hover:bg-zinc-300 text-sm font-medium transition-colors">
                                播放
                            </button>
                            <button onclick="openDownloadModal('${mid}')" class="px-3 h-8 rounded border border-zinc-700 hover:bg-zinc-800 text-sm font-medium transition-colors">
                                下载
                            </button>
                        </div>
                    </div>
                `;
                return songItem;
            };

            if (Array.isArray(songs)) {
                songs.forEach(song => {
                    songList.appendChild(createSongItem(song, song.mid));
                });
            } else if (typeof songs === 'object' && songs !== null) {
                songList.appendChild(createSongItem(songs, keyword));
            } else {
                alert('搜索结果无效，请重试。');
            }
        }

        function playSong(mid) {
            const defaultPlayQuality = document.getElementById('default-play-quality').value;
            let quality = parseInt(defaultPlayQuality);

            const url = `https://api.lolimi.cn/API/qqdg/?mid=${mid}&q=${quality}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        if (data.data.url) {
                            const audioPlayer = document.getElementById('audio-player');
                            audioPlayer.pause();
                            audioPlayer.src = data.data.url;
                            audioPlayer.load();
                            setTimeout(() => {
                                audioPlayer.play().catch(error => {
                                    console.error('播放失败:', error);
                                    alert('播放失败，请重试。');
                                });
                            }, 500);
                            currentSong = data.data;
                            updatePlayerInfo();
                        } else {
                            showEmptyUrlModal();
                        }
                    } else {
                        throw (`code:${data.code}`)
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(`播放失败，请重试。(${error})`);
                });
        }

        function downloadSong(mid, quality) {
            const url = `https://api.lolimi.cn/API/qqdg/?mid=${mid}&q=${quality}`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        if (data.data.url) {
                            const secureUrl = data.data.url.replace(/^http:\/\//i, 'https://');
                            const fileName = `${data.data.singer} - ${data.data.song}.${secureUrl.split('.').pop().split('?')[0]}`;

                            getOSSBlobResource(secureUrl).then(res => {
                                saveFile(res, fileName);
                            });
                        } else {
                            showEmptyUrlModal();
                        }
                    } else {
                        throw (`code:${data.code}`)
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert(`下载失败，请重试。(${error})`);
                });
        }

        function getOSSBlobResource(url) {
            return fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache'
            }).then(response => {
                if (response.ok) {
                    return response.blob();
                } else {
                    throw new Error('Network response was not ok.');
                }
            });
        }

        function saveFile(data, fileName) {
            const exportBlob = new Blob([data]);
            const saveLink = document.createElement('a');
            document.body.appendChild(saveLink);
            saveLink.style.display = 'none';
            const urlObject = window.URL.createObjectURL(exportBlob);
            saveLink.href = urlObject;
            saveLink.download = fileName;
            saveLink.click();
            document.body.removeChild(saveLink);
        }

        function updatePlayerInfo() {
            const songInfo = document.getElementById('song-info');
            if (currentSong) {
                songInfo.innerText = `${currentSong.song} - ${currentSong.singer}`;
            } else {
                songInfo.innerText = '暂无播放内容';
            }
        }

        function copyMID(mid, button) {
            navigator.clipboard.writeText(mid).then(() => {
                const originalText = button.innerText;
                button.innerText = '已复制';
                button.disabled = true;
                setTimeout(() => {
                    button.innerText = originalText;
                    button.disabled = false;
                }, 1000);
            }).catch(err => {
                console.error('无法复制MID:', err);
                alert('无法复制MID，请手动复制。');
            });
        }

        function showEmptyUrlModal() {
            document.getElementById('empty-url-modal').classList.remove('hidden');
        }

        function closeEmptyUrlModal() {
            document.getElementById('empty-url-modal').classList.add('hidden');
        }

        function refreshPage() {
            location.reload();
        }

        window.onload = loadSettings;

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
