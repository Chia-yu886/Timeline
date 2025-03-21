document.addEventListener('DOMContentLoaded', function() {
    loadTimelineData();
});

function loadTimelineData() {
    // 從 JSON 檔案載入資料
    fetch('./data.json')
        .then(response => response.json())
        .then(data => {
            renderTimeline(data.events);
        })
        .catch(error => {
            console.error('載入時間軸資料時發生錯誤:', error);
            document.getElementById('timeline').innerHTML = '<div class="error-message">載入資料時發生錯誤</div>';
        });
}

function renderTimeline(events) {
    const timeline = document.getElementById('timeline');
    if (!timeline) return;

    let html = '';

    // 逐一處理每個年份和事件
    events.forEach(yearData => {
        // 添加年份標記
        html += `<div class="year-marker wow fadeIn">${yearData.year}</div>`;
        
        // 添加該年份的所有事件
        yearData.items.forEach(event => {
            html += `
                <div class="timeline-container ${event.position} wow fadeInLeft">
                    <div class="timeline-item">
                        <div class="event-title">${event.title}</div>
                        <div class="timeline-date">${event.date}</div>
                        <div class="timeline-text">${event.text}</div>
                        ${event.image ? `<img src="${event.image}" alt="" class="timeline-image">` : ''}
                    </div>
                </div>
            `;
        });
    });

    timeline.innerHTML = html;

    // 初始化 WOW 動畫
    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }
}
