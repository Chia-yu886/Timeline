let events = [];
let editingId = null;
const isTimelinePage = window.location.pathname.includes('index.html');
let db;
const request = indexedDB.open('eventsDatabase', 1);

// 當資料庫創建或升級時
request.onupgradeneeded = function(event) {
    db = event.target.result;
    
    // 創建一個 object store（類似於資料表），並設定索引
    if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
    }
};

// 當資料庫開啟成功時
request.onsuccess = function(event) {
    db = event.target.result;
    console.log('資料庫開啟成功');
    loadEventsList();
};

// 當資料庫開啟失敗時
request.onerror = function(event) {
    console.error('資料庫開啟失敗', event.target.errorCode);
};

function addEventToDB(event) {
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    const request = store.add(event); // 添加一個新的事件
    
    request.onsuccess = function() {
        console.log('事件已成功儲存');
    };
    
    request.onerror = function(event) {
        console.error('儲存事件時出現錯誤', event.target.error);
    };
}

function getEventsFromDB(callback) {
    const transaction = db.transaction(['events'], 'readonly');
    const store = transaction.objectStore('events');
    
    const request = store.getAll(); // 讀取所有事件
    
    request.onsuccess = function(event) {
        const events = event.target.result;
        callback(events);
    };
    
    request.onerror = function(event) {
        console.error('讀取事件時出現錯誤', event.target.error);
    };
}

function updateEventInDB(event) {
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    const request = store.put(event); // 更新已存在的事件
    
    request.onsuccess = function() {
        console.log('事件已成功更新');
    };
    
    request.onerror = function(event) {
        console.error('更新事件時出現錯誤', event.target.error);
    };
}

function deleteEventFromDB(id) {
    const transaction = db.transaction(['events'], 'readwrite');
    const store = transaction.objectStore('events');
    
    const request = store.delete(id); // 刪除事件
    
    request.onsuccess = function() {
        console.log('事件已成功刪除');
    };
    
    request.onerror = function(event) {
        console.error('刪除事件時出現錯誤', event.target.error);
    };
}

function loadEventsList() {
    getEventsFromDB(function(events) {
        const eventsList = document.getElementById('timeline');

        if (events.length === 0) {
            eventsList.innerHTML = '<p>尚無任何事件</p>';
            return;
        }

        eventsList.innerHTML = events
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(event => `
                <div class="event-item row ${event.id === editingId ? 'edit-mode' : ''}" id="event-${event.id}">
                    ${event.image ? `<img src="${event.image}" class="event-image-thumb col-md-2 col-sm-2" alt="事件圖片">` : ''}
                    <div class="event-content col-md-8 col-sm-12">
                        <div class="event-title">${event.title}</div>
                        <div class="event-date">${formatDate(event.date)}</div>
                        <div class="event-text">${event.text}</div>
                    </div>
                    <div class="event-actions col-md-2 col-sm-12">
                        <button onclick="editEvent(${event.id})" class="btn-action btn-edit">
                            <i class="fas fa-edit"></i> 編輯
                        </button>
                        <button onclick="deleteEvent(${event.id})" class="btn-action btn-delete">
                            <i class="fas fa-trash"></i> 刪除
                        </button>
                    </div>
                </div>
            `).join('');
    });
}
// 圖片預覽功能
if (!isTimelinePage) {
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // 初始載入事件列表
    loadEventsList();
}

function addEvent() {
    const dateInput = document.getElementById('eventDate');
    const textInput = document.getElementById('eventText');
    const titleInput = document.getElementById('eventTitle');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    
    if (dateInput.value && textInput.value && titleInput.value) {
        const storedEvents = JSON.parse(localStorage.getItem('timelineEvents') || '[]');
        
        // 新增事件
        const newEvent = {
            date: dateInput.value,
            text: textInput.value,
            title: titleInput.value,
            image: imagePreview.style.display !== 'none' ? imagePreview.src : null,
            id: Date.now()
        };
        
        storedEvents.push(newEvent);
        storedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // 儲存至 Local Storage
        localStorage.setItem('timelineEvents', JSON.stringify(storedEvents));

        // 重新載入事件列表
        loadEventsList();

        // 清空表單
        resetForm();
    }
}



function resetForm() {
    const dateInput = document.getElementById('eventDate');
    const textInput = document.getElementById('eventText');
    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('imageInput');
    const submitBtn = document.getElementById('submitBtn');

    dateInput.value = '';
    textInput.value = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    imageInput.value = '';
    submitBtn.textContent = '新增事件';
    editingId = null;
}

function loadEventsList() {
    const eventsList = document.getElementById('timeline');
    const storedEvents = JSON.parse(localStorage.getItem('timelineEvents') || '[]');

    if (storedEvents.length === 0) {
        eventsList.innerHTML = '<p>尚無任何事件</p>';
        return;
    }

    eventsList.innerHTML = storedEvents
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(event => `
            <div class="event-item row ${event.id === editingId ? 'edit-mode' : ''}" id="event-${event.id}">
                ${event.image ? `<img src="${event.image}" class="event-image-thumb col-md-2 col-sm-2" alt="事件圖片">` : ''}
                <div class="event-content col-md-8 col-sm-12">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${formatDate(event.date)}</div>
                    <div class="event-text">${event.text}</div>
                </div>
                <div class="event-actions col-md-2 col-sm-12">
                    <button onclick="editEvent(${event.id})" class="btn-action btn-edit">
                        <i class="fas fa-edit"></i> 編輯
                    </button>
                    <button onclick="deleteEvent(${event.id})" class="btn-action btn-delete">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
            </div>
        `).join('');
}


function editEvent(id) {
    const events = JSON.parse(localStorage.getItem('timelineEvents') || '[]');
    const event = events.find(e => e.id === id);
    if (!event) return;

    const dateInput = document.getElementById('eventDate');
    const textInput = document.getElementById('eventText');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');

    dateInput.value = event.date;
    textInput.value = event.text;
    if (event.image) {
        imagePreview.src = event.image;
        imagePreview.style.display = 'block';
    }

    editingId = id;
    submitBtn.textContent = '更新事件';

    // 滾動到表單
    document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteEvent(id) {
    if (confirm('確定要刪除這個事件嗎？')) {
        const events = JSON.parse(localStorage.getItem('timelineEvents') || '[]');
        const filteredEvents = events.filter(event => event.id !== id);
        localStorage.setItem('timelineEvents', JSON.stringify(filteredEvents));
        
        loadEventsList();
        const timelineFrame = document.getElementById('timelineFrame');
        if (timelineFrame) {
            timelineFrame.contentWindow.location.reload();
        }

        if (editingId === id) {
            resetForm();
        }
    }
}

// Timeline page functions
function updateTimeline() {
    if (!isTimelinePage) return;
    const timeline = document.getElementById('timeline');
    if (!timeline) return;

    const storedEvents = JSON.parse(localStorage.getItem('timelineEvents') || '[]');

    if (storedEvents.length === 0) {
        timeline.innerHTML = '<div class="empty-message">尚未有任何事件，請在上方新增事件</div>';
        return;
    }

    let currentYear = null;
    let html = '';

    storedEvents.forEach((event, index) => {
        const eventYear = new Date(event.date).getFullYear();
        
        if (currentYear !== eventYear) {
            html += `<div class="year-marker wow fadeIn" onclick="secretAccess()">${eventYear}</div>`;
            currentYear = eventYear;
        }

        const position = index % 2 === 0 ? 'left' : 'right';
        html += `
            <div class="timeline-container ${position} wow ${position === 'left' ? 'fadeInLeft' : 'fadeInRight'}">
                <div class="timeline-item">
                    <div class="event-title">${event.title}</div>
                    <div class="timeline-date">${formatDate(event.date)}</div>
                    <div class="timeline-text">${event.text}</div>
                    ${event.image ? `<img src="${event.image}" class="timeline-image" alt="事件圖片">` : ''}
                    
                </div>
            </div>
        `;
    });

    timeline.innerHTML = html;

    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('zh-TW', options);
}

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('timeline-image')) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        modalImg.src = e.target.src;
        $(modal).modal('show');
    }
});

document.addEventListener('DOMContentLoaded', function() {
    if (isTimelinePage) {
        updateTimeline();
    } else {
        loadEventsList();
    }
});

function secretAccess() {
    const secretCode = prompt("請輸入密碼編輯:");
    if (secretCode === "Aa04031219") { // 設定您的密碼
        window.open("dashboard.html", "_blank"); // 另開一個頁面進入 dashboard
    } else {
        alert("密碼錯誤，請重試");
    }
}
