/**
 * @file 时间格式的转换
 * @author raowenjuan(raowenjuan@baidu.com)
 */

/**
 * 秒转换成'hh:mm:ss'的格式
 * @param {number} [currentTime] 需要转换的时间
 * @return {string} 转换后的时间字符串 格式： 00:01
 */
export const formatTime = currentTime => {
    if (!currentTime) {
        return '00:00';
    }
    let hours = Math.floor(currentTime / 3600);
    let minutes = Math.floor((currentTime - 3600 * hours) / 60);
    let seconds = currentTime - 3600 * hours - 60 * minutes;
    if (hours === 0) {
        return (minutes >= 10 ? minutes : '0' + minutes)
            + ':'
            + (seconds >= 10 ? seconds : '0' + seconds);
    } else {
        return (hours >= 10 ? hours : '0' + hours)
            + ':'
            + (minutes >= 10 ? minutes : '0' + minutes)
            + ':'
            + (seconds >= 10 ? seconds : '0' + seconds);
    }
};