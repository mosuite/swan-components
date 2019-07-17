/**
 * @file 自定义组件中相关工具方法
 * @author lvlei(lvlei03@baidu.com)
 */

/**
 * 将字符串转换成数组, 同时去除空元素
 *
 * @param {string} str - 需要转换的字符串
 * @return {Array} 清理之后的classList
 */
export const strToArr = str => str.trim().split(' ').filter(item => item !== '');

/**
 * 添加自定义组件内层组件前缀
 *
 * @param {string} className - 类名
 * @param {string} perfix    - 待添加的前缀
 * @return {string} 经过处理的类名
 */
export const addClassPrefix = (className, perfix) => {
    return className.replace(new RegExp(`^(${perfix}__)?`), `${perfix}__`);
};

/**
 * 删除自定义组件内层组件前缀
 *
 * @param {string} className - 类名
 * @param {string} perfix    - 待删除的前缀
 * @return {string} 经过处理的类名
 */
export const delClassPrefix = (className, perfix) => {
    return className.replace(new RegExp(`^(${perfix}__)?`), '');
};