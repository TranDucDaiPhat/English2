let listWord = []
let currentIndex = 0
let lenListWord = 0
let isShow = false
let audioUrl = ''
let audio = null
let isMuted = false
let checkNote = false
let noteList = []
let isClosingPopup = false;
let openPopups = new Set();

const $ = document.getElementById.bind(document)

const word = $('word-text');
const ipa = $('ipa');
const pos = $('pos');
const mean = $('mean');
const img = $('img');
const count = $('count');
const back = $('back');
const btnNote = $('btnNote');
const iconCheckNote = $('noteIcon');

img.onerror = () => {
    img.removeAttribute('src');
};

const soundIcon = document.getElementById('sound-icon');
const repeatIcon = document.getElementById('repeat-icon');

const tooltip = word.querySelector(".tooltip");

const wordTooltip = document.getElementById('word');
wordTooltip.addEventListener("click", () => {
    const text = word.innerText.trim(); // loại bỏ tooltip text khỏi nội dung copy

    navigator.clipboard.writeText(text).then(() => {
        wordTooltip.classList.add("show-tooltip");

        setTimeout(() => {
            wordTooltip.classList.remove("show-tooltip");
        }, 1500); // Ẩn tooltip sau 1.5 giây
    }).catch((err) => {
        console.error("Lỗi sao chép:", err);
    });
});

soundIcon.onclick = function () {
    isMuted = !isMuted
    soundIcon.src = isMuted ? 'image/32-mute.png' : 'image/32-unmute.png';
};

repeatIcon.onclick = function () {
    playSound(audioUrl)
}

back.onclick = function () {
    if (currentIndex > 0) {
        currentIndex--;
        renderWord()
        checkImage()
    }
};

btnNote.onclick = function () {
    checkNote = !checkNote
    if (checkListNote()) {
        noteList.push(currentIndex)
    }
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

function checkImage() {
    const el = document.getElementById('wrapper');
    if (isShow) {
        el.style.display = !img.getAttribute('src') ? 'none' : 'flex'
        img.style.display = !img.getAttribute('src') ? 'none' : 'block'
    } else {
        el.style.display = 'none'
        img.style.display = 'none'
    }
}

document.addEventListener('click', function (event) {
    setTimeout(() => {
        if (isClosingPopup) {
            return;
        }

        // Bỏ qua nếu click vào ảnh
        if (event.target.tagName.toLowerCase() === 'img' || event.target.id === 'word-text' || event.target.id === 'btnNote') return;

        if (isShow) {
            currentIndex++
            if (currentIndex >= lenListWord) {
                currentIndex = 0
                start()
            } else {
                renderWord()
            }
        } else {
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

        checkImage()
    }, 0);
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
    let [_name, _ipa, _pos, _sound, _img, _mean] = splitWithLimit(listWord[currentIndex], ',', 5)
    _mean = _mean.replace(/"/g, '');
    word.textContent = _name
    ipa.textContent = _ipa
    pos.textContent = _pos
    mean.textContent = _mean
    img.src = _img
    audioUrl = _sound

    checkNote = checkNameListNote(_name)
    checkListNote()

    count.innerText = `${currentIndex + 1}/${lenListWord}`
}

function checkNameListNote(name) {
    for (i of noteList) {
        if (splitWithLimit(listWord[i], ',', 1)[0] === name) {
            return true
        }
    }
    return false
}

function checkListNote() {
    if (checkNote == false) {
        removeWordFromNote(currentIndex)
        return false
    } else {
        iconCheckNote.classList.add("isNote");
        btnNote.classList.add("isNote");
        return true
    }
}

function removeWordFromNote(index) {
    if (index == currentIndex) {
        iconCheckNote.classList.remove("isNote");
        btnNote.classList.remove("isNote");
        checkNote = false
    }
    for (i in noteList) {
        if (noteList[i] == index) {
            noteList.splice(i, 1)
            break;
        }
    }
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

getData("CurrentList.txt")
    .then((data) => {
        listWord = data
        lenListWord = listWord.length
        start()
    })
    .catch((e) => console.error(e));

function openPopup(popupId) {
    const popup = document.getElementById(popupId);
    const overlay = document.getElementById(`overlay-${popupId}`);
    if (!popup || !overlay) return;

    popup.style.display = 'block';
    overlay.style.display = 'block';

    openPopups.add(popupId);
    setTimeout(() => {
        document.addEventListener('click', outsideClickListener);
    }, 100);
}

function closePopup(popupId) {
    const popup = document.getElementById(popupId);
    const overlay = document.getElementById(`overlay-${popupId}`);

    if (!popup || !overlay) return;

    popup.style.display = 'none';
    overlay.style.display = 'none';

    openPopups.delete(popupId);

    if (openPopups.size === 0) {
        document.removeEventListener('click', outsideClickListener);
    }
}

function openPopup1() {
    renderItemList();
    openPopup('popup1');
}

function outsideClickListener(event) {
    for (let popupId of openPopups) {
        const popup = document.getElementById(popupId);
        if (!popup.contains(event.target)) {
            isClosingPopup = true;
            closePopup(popupId);
        }
    }
    setTimeout(() => {
        isClosingPopup = false;
    }, 0);
}

function renderItemList() {
    const itemList = document.getElementById('itemList');
    itemList.innerHTML = ''; // Xoá danh sách cũ nếu có

    noteList.forEach(index => {
        const div = document.createElement('div');
        let [name, ipa, pos, sound, img, mean] = splitWithLimit(listWord[index], ',', 5)
        div.textContent = name;
        div.classList.add('item');  
        div.onclick = () => showDetailPopup({ index, name, ipa, pos, mean });
        itemList.appendChild(div);
    })
}

function showDetailPopup(word) {
    $('detailName').textContent = word.name
    $('detailIpa').textContent = word.ipa
    $('detailPos').textContent = word.pos
    $('detailMean').textContent = word.mean
    $('remove-word').onclick = () => {
        removeWordFromNote(word.index)
        closePopup('popup2')
        renderItemList()
    }

    openPopup('popup2');
}
