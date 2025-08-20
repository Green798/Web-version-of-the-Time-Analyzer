// 全局变量
let activities = [];
let timeRecords = [];
let currentActivity = null;
let isRecording = false;
let recordStartTime = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化数据
    loadData();
    
    // 初始化活动按钮
    renderActivityButtons();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新当前日期时间显示
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);
});

// 加载保存的数据
function loadData() {
    // 从localStorage加载活动数据
    const savedActivities = localStorage.getItem('timeAnalyzer_activities');
    if (savedActivities) {
        activities = JSON.parse(savedActivities);
    } else {
        // 默认活动
        activities = [
            { id: 1, name: '工作', color: '#e74c3c' },
            { id: 2, name: '学习', color: '#3498db' },
            { id: 3, name: '休息', color: '#2ecc71' },
            { id: 4, name: '娱乐', color: '#f39c12' },
            { id: 5, name: '其他', color: '#95a5a6' }
        ];
        saveActivities();
    }
    
    // 从localStorage加载时间记录数据
    const savedTimeRecords = localStorage.getItem('timeAnalyzer_timeRecords');
    if (savedTimeRecords) {
        timeRecords = JSON.parse(savedTimeRecords);
    }
}

// 保存活动数据到localStorage
function saveActivities() {
    localStorage.setItem('timeAnalyzer_activities', JSON.stringify(activities));
}

// 保存时间记录数据到localStorage
function saveTimeRecords() {
    localStorage.setItem('timeAnalyzer_timeRecords', JSON.stringify(timeRecords));
}

// 渲染活动按钮
function renderActivityButtons() {
    const activityButtonsContainer = document.getElementById('activity-buttons');
    if (!activityButtonsContainer) return;
    
    activityButtonsContainer.innerHTML = '';
    
    activities.forEach(activity => {
        const button = document.createElement('button');
        button.className = 'activity-btn';
        button.style.backgroundColor = activity.color;
        button.dataset.id = activity.id;
        button.textContent = activity.name;
        
        button.addEventListener('click', function() {
            selectActivity(activity.id);
        });
        
        activityButtonsContainer.appendChild(button);
    });
}

// 选择活动
function selectActivity(activityId) {
    const activityButtons = document.querySelectorAll('.activity-btn');
    activityButtons.forEach(button => {
        if (parseInt(button.dataset.id) === activityId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    currentActivity = activities.find(activity => activity.id === activityId);
    
    // 如果已经选择了活动，启用开始按钮
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.disabled = !currentActivity;
    }
}

// 开始记录时间
function startRecording() {
    if (!currentActivity) return;
    
    isRecording = true;
    recordStartTime = new Date();
    
    // 更新UI
    const startBtn = document.getElementById('start-btn');
    const endBtn = document.getElementById('end-btn');
    const recordStatus = document.getElementById('record-status');
    
    if (startBtn) startBtn.disabled = true;
    if (endBtn) endBtn.disabled = false;
    if (recordStatus) {
        recordStatus.textContent = `正在记录: ${currentActivity.name}`;
        recordStatus.style.color = currentActivity.color;
    }
}

// 结束记录时间
function endRecording() {
    if (!isRecording || !currentActivity || !recordStartTime) return;
    
    const endTime = new Date();
    const duration = endTime - recordStartTime; // 毫秒
    
    // 只有当记录时间超过1分钟时才保存
    if (duration >= 60000) {
        const newRecord = {
            id: Date.now(),
            activityId: currentActivity.id,
            startTime: recordStartTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: duration,
            date: formatDate(recordStartTime)
        };
        
        timeRecords.push(newRecord);
        saveTimeRecords();
    }
    
    // 重置状态
    isRecording = false;
    recordStartTime = null;
    
    // 更新UI
    const startBtn = document.getElementById('start-btn');
    const endBtn = document.getElementById('end-btn');
    const recordStatus = document.getElementById('record-status');
    
    if (startBtn && currentActivity) startBtn.disabled = false;
    if (endBtn) endBtn.disabled = true;
    if (recordStatus) {
        recordStatus.textContent = '未开始记录';
        recordStatus.style.color = '';
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 开始按钮
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startRecording);
    }
    
    // 结束按钮
    const endBtn = document.getElementById('end-btn');
    if (endBtn) {
        endBtn.addEventListener('click', endRecording);
    }
    
    // 添加活动按钮
    const addActivityBtn = document.getElementById('add-activity-btn');
    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('add-activity-modal'));
            modal.show();
        });
    }
    
    // 保存新活动按钮
    const saveActivityBtn = document.getElementById('save-activity-btn');
    if (saveActivityBtn) {
        saveActivityBtn.addEventListener('click', function() {
            const activityName = document.getElementById('activity-name').value.trim();
            const activityColor = document.getElementById('activity-color').value;
            
            if (activityName) {
                const newActivity = {
                    id: Date.now(),
                    name: activityName,
                    color: activityColor
                };
                
                activities.push(newActivity);
                saveActivities();
                renderActivityButtons();
                
                // 关闭模态框并重置表单
                const modal = bootstrap.Modal.getInstance(document.getElementById('add-activity-modal'));
                modal.hide();
                document.getElementById('add-activity-form').reset();
            }
        });
    }
}

// 更新当前日期时间显示
function updateCurrentDateTime() {
    const currentDateTimeElement = document.getElementById('current-date-time');
    if (currentDateTimeElement) {
        const now = new Date();
        currentDateTimeElement.textContent = formatDateTime(now);
    }
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 格式化日期时间为 YYYY-MM-DD HH:MM:SS
function formatDateTime(date) {
    const d = new Date(date);
    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

// 格式化时间为 HH:MM
function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 计算时间段的持续时间（格式化为小时和分钟）
function formatDuration(milliseconds) {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`;
    } else {
        return `${minutes}分钟`;
    }
}

// 获取指定日期的时间记录
function getRecordsByDate(date) {
    const dateStr = formatDate(date);
    console.log('查找日期:', dateStr);
    const result = timeRecords.filter(record => {
        const recordDate = formatDate(new Date(record.startTime));
        console.log('比较记录日期:', recordDate, '与目标日期:', dateStr, '结果:', recordDate === dateStr);
        return recordDate === dateStr;
    });
    console.log('找到记录:', result.length);
    return result;
}

// 获取活动信息通过ID
function getActivityById(id) {
    return activities.find(activity => activity.id === id) || {
        name: '未知活动',
        color: '#999999'
    };
}

// 导出函数供其他脚本使用
window.timeAnalyzer = {
    // 返回活动数组的函数，而不是直接引用
    getActivities: function() {
        return activities;
    },
    // 返回时间记录数组的函数，而不是直接引用
    getTimeRecords: function() {
        return timeRecords;
    },
    getRecordsByDate,
    getActivityById,
    formatTime,
    formatDate,
    formatDateTime,
    formatDuration
};