// 分析页面功能实现
document.addEventListener('DOMContentLoaded', function() {
    // 初始化日期选择器
    initDateSelector();
    
    // 加载当天数据
    loadDataForDate(new Date());
});

// 初始化日期选择器
function initDateSelector() {
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const selectedDateElement = document.getElementById('selected-date');
    
    // 设置当前日期
    let currentDate = new Date();
    updateSelectedDateDisplay(currentDate, selectedDateElement);
    
    // 前一天按钮
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', function() {
            currentDate.setDate(currentDate.getDate() - 1);
            updateSelectedDateDisplay(currentDate, selectedDateElement);
            loadDataForDate(currentDate);
        });
    }
    
    // 后一天按钮
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', function() {
            currentDate.setDate(currentDate.getDate() + 1);
            updateSelectedDateDisplay(currentDate, selectedDateElement);
            loadDataForDate(currentDate);
        });
    }
}

// 更新选中日期显示
function updateSelectedDateDisplay(date, element) {
    if (element) {
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        element.textContent = `${window.timeAnalyzer.formatDate(date)}${isToday ? ' (今天)' : ''}`;
    }
}

// 加载指定日期的数据
function loadDataForDate(date) {
    // 获取所有时间记录
    const allRecords = window.timeAnalyzer.getTimeRecords();
    console.log('所有记录:', allRecords);
    
    // 手动筛选指定日期的记录
    const dateStr = window.timeAnalyzer.formatDate(date);
    console.log('查找日期:', dateStr);
    
    const records = allRecords.filter(record => {
        const recordDate = window.timeAnalyzer.formatDate(new Date(record.startTime));
        console.log('记录日期:', recordDate, '目标日期:', dateStr);
        return recordDate === dateStr;
    });
    
    console.log('找到记录数:', records.length);
    
    // 渲染时间分布图表
    renderTimeDistributionChart(records);
    
    // 渲染活动统计图表
    renderActivityStatsChart(records);
    
    // 渲染活动统计摘要
    renderActivitySummary(records);
    
    // 渲染时间记录列表
    renderTimeRecords(records);
    
    // 如果没有记录，显示提示信息
    const noDataMessage = document.getElementById('no-records-message');
    if (noDataMessage) {
        if (!records || records.length === 0) {
            noDataMessage.textContent = `${window.timeAnalyzer.formatDate(date)} 没有记录数据。请在主页记录活动后再查看。`;
            noDataMessage.style.display = 'block';
        } else {
            noDataMessage.style.display = 'none';
        }
    }
}

// 渲染时间分布图表（24小时活动分布）
function renderTimeDistributionChart(records) {
    const ctx = document.getElementById('time-distribution-chart');
    if (!ctx) return;
    
    // 清除旧图表
    if (window.timeDistributionChart) {
        window.timeDistributionChart.destroy();
    }
    
    // 如果没有记录，显示空图表
    if (!records || records.length === 0) {
        window.timeDistributionChart = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    data: Array(24).fill(0.1), // 使用极小值而不是0，以便显示图表结构
                    backgroundColor: Array(24).fill('rgba(200, 200, 200, 0.2)'),
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        display: false
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '暂无数据';
                            }
                        }
                    }
                }
            }
        });
        return;
    }
    
    // 准备24小时数据
    const hoursData = Array(24).fill(null);
    const hoursColors = Array(24).fill('#f8f9fa');
    
    // 填充有记录的小时
    // 获取所有活动
    const activities = window.timeAnalyzer.getActivities();
    
    records.forEach(record => {
        const startTime = new Date(record.startTime);
        const endTime = new Date(record.endTime);
        // 从活动列表中查找匹配的活动
        const activity = activities.find(a => a.id === record.activityId) || {
            name: '未知活动',
            color: '#999999'
        };
        
        // 计算每个小时的占用情况
        let currentHour = new Date(startTime);
        currentHour.setMinutes(0, 0, 0);
        
        while (currentHour <= endTime) {
            const hour = currentHour.getHours();
            
            // 如果这个小时在记录的时间范围内
            if (currentHour >= startTime && currentHour <= endTime) {
                hoursData[hour] = activity.name;
                hoursColors[hour] = activity.color;
            }
            
            // 移动到下一个小时
            currentHour.setHours(currentHour.getHours() + 1);
        }
    });
    
    // 创建图表
    window.timeDistributionChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                data: Array(24).fill(1), // 均等分布
                backgroundColor: hoursColors,
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    display: false
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const hour = context.label.split(':')[0];
                            return hoursData[hour] || '无活动';
                        }
                    }
                }
            }
        }
    });
}

// 渲染活动统计图表
function renderActivityStatsChart(records) {
    const ctx = document.getElementById('activity-stats-chart');
    if (!ctx) return;
    
    // 清除旧图表
    if (window.activityStatsChart) {
        window.activityStatsChart.destroy();
    }
    
    // 按活动类型统计时间
    const activityStats = {};
    
    // 如果没有记录，显示空图表
    if (!records || records.length === 0) {
        // 创建空图表
        window.activityStatsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['暂无数据'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#f8f9fa'],
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
        return;
    }
    
    records.forEach(record => {
        const activityId = record.activityId;
        const duration = record.duration;
        
        if (!activityStats[activityId]) {
            activityStats[activityId] = 0;
        }
        
        activityStats[activityId] += duration;
    });
    
    // 准备图表数据
    const labels = [];
    const data = [];
    const colors = [];
    
    // 获取所有活动
    const activities = window.timeAnalyzer.getActivities();
    
    for (const activityId in activityStats) {
        // 从活动列表中查找匹配的活动
        const activity = activities.find(a => a.id === parseInt(activityId)) || {
            name: '未知活动',
            color: '#999999'
        };
        labels.push(activity.name);
        data.push(activityStats[activityId]);
        colors.push(activity.color);
    }
    
    // 创建图表
    window.activityStatsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const duration = window.timeAnalyzer.formatDuration(value);
                            return `${context.label}: ${duration}`;
                        }
                    }
                }
            }
        }
    });
}

// 渲染活动统计摘要
function renderActivitySummary(records) {
    const summaryContainer = document.getElementById('activity-summary');
    if (!summaryContainer) return;
    
    // 清空容器
    summaryContainer.innerHTML = '';
    
    // 如果没有记录，显示提示信息
    if (!records || records.length === 0) {
        const noDataElement = document.createElement('div');
        noDataElement.className = 'text-center text-muted my-3';
        noDataElement.textContent = '暂无活动统计数据';
        summaryContainer.appendChild(noDataElement);
        return;
    }
    
    // 按活动类型统计时间
    const activityStats = {};
    let totalDuration = 0;
    
    records.forEach(record => {
        const activityId = record.activityId;
        const duration = record.duration;
        
        if (!activityStats[activityId]) {
            activityStats[activityId] = 0;
        }
        
        activityStats[activityId] += duration;
        totalDuration += duration;
    });
    
    // 获取所有活动
    const activities = window.timeAnalyzer.getActivities();
    
    // 创建摘要项
    for (const activityId in activityStats) {
        // 从活动列表中查找匹配的活动
        const activity = activities.find(a => a.id === parseInt(activityId)) || {
            name: '未知活动',
            color: '#999999'
        };
        const duration = activityStats[activityId];
        const percentage = Math.round((duration / totalDuration) * 100);
        
        const summaryItem = document.createElement('div');
        summaryItem.className = 'activity-summary-item';
        summaryItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="activity-name">
                    <span class="activity-color-dot" style="background-color: ${activity.color}"></span>
                    ${activity.name}
                </div>
                <div class="activity-duration">${window.timeAnalyzer.formatDuration(duration)}</div>
            </div>
            <div class="progress">
                <div class="progress-bar" role="progressbar" style="width: ${percentage}%; background-color: ${activity.color}" 
                    aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage}%</div>
            </div>
        `;
        
        summaryContainer.appendChild(summaryItem);
    }
    
    // 添加总计
    const totalItem = document.createElement('div');
    totalItem.className = 'activity-summary-item fw-bold mt-2';
    totalItem.innerHTML = `
        <div>总计</div>
        <div>${window.timeAnalyzer.formatDuration(totalDuration)}</div>
    `;
    
    summaryContainer.appendChild(totalItem);
}

// 渲染时间记录列表
function renderTimeRecords(records) {
    const recordsContainer = document.getElementById('time-records');
    const noRecordsMessage = document.getElementById('no-records-message');
    
    if (!recordsContainer) return;
    
    // 清空容器（保留无记录消息）
    recordsContainer.innerHTML = '';
    if (noRecordsMessage) {
        recordsContainer.appendChild(noRecordsMessage);
    }
    
    // 显示或隐藏无记录消息
    if (noRecordsMessage) {
        noRecordsMessage.style.display = (!records || records.length === 0) ? 'block' : 'none';
    }
    
    if (!records || records.length === 0) return;
    
    // 按开始时间排序（最新的在前）
    const sortedRecords = [...records].sort((a, b) => {
        return new Date(b.startTime) - new Date(a.startTime);
    });
    
    // 创建表格
    const table = document.createElement('table');
    table.className = 'table table-striped';
    
    // 创建表头
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>活动</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>持续时间</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    sortedRecords.forEach(record => {
        // 获取所有活动
        const activities = window.timeAnalyzer.getActivities();
        // 从活动列表中查找匹配的活动
        const activity = activities.find(a => a.id === record.activityId) || {
            name: '未知活动',
            color: '#999999'
        };
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${activity.name}</td>
            <td>${window.timeAnalyzer.formatDateTime(new Date(record.startTime))}</td>
            <td>${window.timeAnalyzer.formatDateTime(new Date(record.endTime))}</td>
            <td>${window.timeAnalyzer.formatDuration(record.duration)}</td>
        `;
        
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    recordsContainer.appendChild(table);
}