/**
 * @file Android video helper
 * @author wuhuiyao(wuhuiyao@baidu.com)
 */

/**
 * 给数字补上前缀 0
 *
 * @inner
 * @param {number} num 要补 0 数字
 * @return {string}
 */
function padNum(num) {
    return num < 10 ? `0${num}` : `${num}`;
}

/**
 * 格式化时间
 *
 * @param {number} totalSec 要格式化的时间，单位：秒
 * @return {string}
 */
export function formatTime(totalSec) {
    let hours = Math.floor(totalSec / 3600);
    let minutes = Math.floor((totalSec % 3600) / 60);
    let seconds = Math.floor((totalSec % 3600) % 60);
    let value = `${padNum(minutes)}:${padNum(seconds)}`;

    if (hours) {
        value = padNum(hours) + ':' + value;
    }

    return value;
}
