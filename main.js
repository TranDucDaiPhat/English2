let listWord = []
let currentIndex = 0
let lenListWord = 0
let isShow = false
let audioUrl = ''
let audio = null
let isMuted = false


const word = document.getElementById('word');
const ipa = document.getElementById('ipa');
const pos = document.getElementById('pos');
const mean = document.getElementById('mean');

const soundIcon = document.getElementById('sound-icon');
const repeatIcon = document.getElementById('repeat-icon');

soundIcon.onclick = function () {
    isMuted = !isMuted
    soundIcon.src = isMuted ? 'image/32-mute.png' : 'image/32-unmute.png';
};

repeatIcon.onclick = function () {
    playSound(audioUrl)
}

function playSound(url) {
    // loại bỏ audio cũ
    if (audio) {
        audio.pause();
        audio.src = '';
        audio.load(); // Hủy buffer nếu có
        audio = null;
    }
    audio = new Audio(url);

    function cleanUp() {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
    }

    function onCanPlay() {
        cleanUp();
        audio.play();
    }

    function onError() {
        cleanUp();
    }

    audio.addEventListener('canplaythrough', onCanPlay);
    audio.addEventListener('error', onError);
}


document.addEventListener('click', function (event) {
    // Bỏ qua nếu click vào ảnh
    if (event.target.tagName.toLowerCase() === 'img') return;

    if (isShow) {
        currentIndex++
        if (currentIndex >= lenListWord) {
            currentIndex = 0
            start()
        } else {
            renderWord()
        }
        if (!isMuted) {
            playSound(audioUrl)
        }
    }
    isShow = !isShow

    const ids = ['ipa', 'pos', 'mean'];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Dùng getComputedStyle để kiểm tra trạng thái hiển thị thực tế
            const isHidden = window.getComputedStyle(el).display === 'none';
            el.style.display = isHidden ? 'block' : 'none';
        }
    });
});



function getData(filePath) {
    return fetch(filePath)
        .then((res) => res.text())
        .then((text) => {
            return text.split('\n').map(s => s.trim());
        });
}

function splitWithLimit(str, delimiter, maxSplits) {
    const parts = str.split(delimiter);
    const head = parts.slice(0, maxSplits);
    const tail = parts.slice(maxSplits).join(delimiter); // phần còn lại ghép lại
    return [...head, tail]; // trả về mảng đã xử lý
}

function renderWord() {
    let [_name, _ipa, _pos, _sound, _mean] = splitWithLimit(listWord[currentIndex], ',', 4)
    _mean = _mean.replace(/"/g, '');
    word.textContent = _name
    ipa.textContent = _ipa
    pos.textContent = _pos
    mean.textContent = _mean
    audioUrl = _sound
}

function start() {
    let steps = Math.round(listWord.length / 3)
    steps = steps <= 150 ? steps : 150
    for (let i = 0; i < steps; i++) {
        let num = Math.floor(Math.random() * listWord.length)
        let swap = listWord[i]
        listWord[i] = listWord[num]
        listWord[num] = swap
    }
    renderWord()
}

getData("EngWord.txt")
    .then((data) => {
        listWord = data
        lenListWord = listWord.length
        start()
    })
    .catch((e) => console.error(e));