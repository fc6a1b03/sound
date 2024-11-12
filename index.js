let currentSong = null;
let selectedMID = null;
let selectedQuality = null;

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        searchSongs();
    }
}

function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
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
    document.getElementById('custom-quality').value = ''
    document.getElementById('download-modal').style.display = 'block';
    // 默认选中设置的默认下载音质
    const defaultDownloadQuality = document.getElementById('default-download-quality').value;
    const qualityRadios = document.querySelectorAll('input[name="download-quality"]');
    qualityRadios.forEach(radio => {
        if (radio.value === defaultDownloadQuality) {
            radio.checked = true;
        }
    });
    // 绑定事件监听器
    qualityRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                document.getElementById('custom-quality').value = '';
            }
        });
    });
    document.getElementById('custom-quality').addEventListener('input', () => qualityRadios.forEach(radio => radio.checked = false));
}

function closeDownloadModal() {
    document.getElementById('download-modal').style.display = 'none';
}

function downloadSelectedQuality() {
    let quality = null;
    const qualityRadios = document.querySelectorAll('input[name="download-quality"]');
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
    let url;
    const searchType = document.getElementById('search-type').value;
    const keyword = document.getElementById('search-input').value;
    if (!keyword) return
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
    if (Array.isArray(songs)) {
        songs.forEach(song => {
            const songItem = document.createElement('div');
            songItem.className = 'song-item';
            songItem.innerHTML = `
                <img src="${song.cover}" alt="${song.song}">
                <div class="info">
                    <div>${song.song} - ${song.singer}</div>
                    <div>专辑: ${song.album}</div>
                    <div>MID: ${song.mid} <button onclick="copyMID('${song.mid}', this)">复制</button></div>
                </div>
                <div class="actions">
                    <button onclick="playSong('${song.mid}')">播放</button>
                    <button onclick="openDownloadModal('${song.mid}')">下载</button>
                </div>
            `;
            songList.appendChild(songItem);
        });
    } else if (typeof songs === 'object' && songs !== null) {
        const song = songs;
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.innerHTML = `
            <img src="${song.cover}" alt="${song.song}">
            <div class="info">
                <div>${song.song} - ${song.singer}</div>
                <div>专辑: ${song.album}</div>
                <div>MID: ${keyword} <button onclick="copyMID('${keyword}', this)">复制</button></div>
            </div>
            <div class="actions">
                <button onclick="playSong('${keyword}')">播放</button>
                <button onclick="openDownloadModal('${keyword}')">下载</button>
            </div>
        `;
        songList.appendChild(songItem);
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
                    audioPlayer.pause(); // 先暂停当前音频
                    audioPlayer.src = data.data.url;
                    audioPlayer.load(); // 先加载音频
                    // 添加一个短暂的延迟
                    setTimeout(() => {
                        audioPlayer.play().catch(error => {
                            console.error('播放失败:', error);
                            alert('播放失败，请重试。');
                        });
                    }, 500);
                    currentSong = data.data;
                    updatePlayerInfo();
                } else {
                    showEmptyUrlModal(); // 显示弹窗提示
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
                    // 将HTTP URL转换为HTTPS URL
                    const secureUrl = data.data.url.replace(/^http:\/\//i, 'https://');
                    const fileName = `${data.data.singer} - ${data.data.song}.${secureUrl.split('.').pop().split('?')[0]}`;
                    getOSSBlobResource(secureUrl).then(res => saveFile(res, fileName));
                } else {
                    showEmptyUrlModal(); // 显示弹窗提示
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
    const player = document.getElementById('player');
    const songInfo = document.getElementById('song-info');
    if (currentSong) {
        player.querySelector('audio').src = currentSong.url;
        songInfo.innerText = `${currentSong.song} - ${currentSong.singer}`;
    } else {
        player.querySelector('audio').src = '';
        songInfo.innerText = '';
    }
}

function copyMID(mid, button) {
    navigator.clipboard.writeText(mid).then(() => {
        button.innerText = '已复制';
        button.disabled = true;
        setTimeout(() => {
            button.innerText = '复制';
            button.disabled = false;
        }, 1000);
    }).catch(err => {
        console.error('无法复制MID:', err);
        alert('无法复制MID，请手动复制。');
    });
}

function showEmptyUrlModal() {
    document.getElementById('empty-url-modal').style.display = 'block';
}

function closeEmptyUrlModal() {
    document.getElementById('empty-url-modal').style.display = 'none';
}

function refreshPage() {
    location.reload();
}

window.onload = loadSettings;
