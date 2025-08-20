// 时钟功能实现
document.addEventListener('DOMContentLoaded', function() {
    // 初始化时钟
    initClock();
    
    // 每秒更新时钟
    setInterval(updateClock, 1000);
});

// 初始化时钟
function initClock() {
    updateClock();
}

// 更新时钟
function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // 计算指针角度
    const hourDegrees = (hours % 12) * 30 + minutes * 0.5; // 每小时30度，每分钟0.5度
    const minuteDegrees = minutes * 6; // 每分钟6度
    const secondDegrees = seconds * 6; // 每秒6度
    
    // 更新指针样式
    const hourHand = document.querySelector('.clock-hour');
    const minuteHand = document.querySelector('.clock-minute');
    const secondHand = document.querySelector('.clock-second');
    
    if (hourHand && minuteHand && secondHand) {
        hourHand.style.transform = `rotate(${hourDegrees}deg)`;
        minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
        secondHand.style.transform = `rotate(${secondDegrees}deg)`;
    }
}