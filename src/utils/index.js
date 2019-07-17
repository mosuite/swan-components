/**
 * @file utils for swan
 * @author houyu(houyu01@baidu.com)
 */
import {Data} from './data';
import EnviromentEvent from './enviroment-event';
export {Data, EnviromentEvent};
export * from './style';
export {formatTime} from './date';
export * from './path';
export {privateKey} from './private-key';
export {eventProccesser} from './event';
export {COMPONENT_STATE} from './constant';

/**
 * 判断Val的真假并非以普适性原则，如果设定了属性，但是没有给其Boolean的值，也被视为真
 * @param {boolean|String|number} [attrVal] 需要判断的属性值
 * @return {boolean} 判断结果
 */
export const attrValBool = attrVal => {
    return !!attrVal && attrVal !== 'false' || attrVal === '';
};
export const datasetFilter = raw => {
    let dataset = {};
    for (let d in raw) {
        if (/data/g.exec(d)) {
            let afrKey = d.replace(/^data([\w\d])/, (all, alpha) => alpha.toLowerCase());
            dataset[afrKey] = raw[d];
        }
    }
    return dataset;
};

export const convertToCamelCase = str => str.replace(/\-([a-z])/g, (all, first) => first.toUpperCase());

export const sanComponentWalker = target => {
    if (target.sanComponent || target.tagName.toLowerCase() === 'body') {
        return target.sanComponent || {};
    }
    return sanComponentWalker(target.parentNode);
};

export const computeDistance = (point1, point2) => {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
};

export const noop = () => {};

export const getValueSafety = (data, path) => {
    return (new Data(data)).get(path);
};

/**
 * 用于判断是否为值相同数组（若为对象数组，则对指定key执行比较）
 * @param {Array} a 目标数组
 * @param {Array} b 对比数组
 * @param {string} key 数组为对象数组时指定的比较key
 * @return {boolean} 比较结果，true表示为不同，false为相同
 */
export const isDiffArray = (a, b, key) => {
    if (a.length !== b.length) {
        return true;
    }
    let length = a.length;
    // 依次比值
    for (let i = 0; i < length; i++) {
        let result = true;
        if (typeof a[i] === 'object' && typeof b[i] === 'object') {
            result = a[i][key] === b[i][key];
        }
        else {
            result = typeof a[i] === typeof b[i] && a[i] === b[i];
        }
        if (!result) {
            return true;
        }
    }
    return false;
};

/**
 * 用于判断是否为值相同对象（若有value为对象，则对指定key进行比较）
 * @param {Array} x 目标对象
 * @param {Array} y 对比对象
 * @return {boolean} 比较结果，true表示相同，false为不同
 */
export const isEqualObject = (x = {}, y = {}) => {
    let inx = x instanceof Object;
    let iny = y instanceof Object;
    if (!inx || !iny) {
        return x === y;
    }
    if (Object.keys(x).length !== Object.keys(y).length) {
        return false;
    }
    for (let key in x) {
        let a = x[key] instanceof Object;
        let b = y[key] instanceof Object;
        if (a && b) {
            if (!isEqualObject(x[key], y[key])) {
                return false;
            }
        } else if (x[key] !== y[key]) {
            return false;
        }
    }
    return true;
};

/**
 * 用于判断是否为值是否为对象
 * @param {Object} value 目标对象
 * @return {boolean} 比较结果
 */
export const isObject = value => Object.prototype.toString.apply(value) === '[object Object]';

/**
 * 用于判断是否为值是否为数组
 * @param {Array} value 目标数组
 * @return {boolean} 比较结果
 */
export const isArray = value => Object.prototype.toString.apply(value) === '[object Array]';

/**
 * 用于判断是否为值是否为函数
 * @param {Function} value 目标函数
 * @return {boolean} 比较结果
 */
export const isFunction = value => Object.prototype.toString.apply(value) === '[object Function]';

/**
 * 用于比较两个对象之间的 diff
 * @param {Object} lhs 目标数组 1
 * @param {Object} rhs 目标数组 2
 * @param {Array} whiteList 当 lhs 与 rhs 存在 diff 时，会向 diff 结果中追加 whiteList 中 key 的 值（值取自 rhs）
 * @return {Object} res 比较结果
 */
export const diff = (lhs = {}, rhs = {}, whiteList = []) => {
    const keys = Object.keys(rhs);
    const res = {};
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let oldValue = lhs[key];
        let newValue = rhs[key];
        if (isObject(oldValue) || isArray(oldValue)) {
            oldValue = JSON.stringify(oldValue);
        }
        if (isObject(newValue) || isArray(newValue)) {
            newValue = JSON.stringify(newValue);
        }
        if (oldValue === newValue) {
            continue;
        }
        if (isObject(rhs[key])) {
            res[key] = {
                ...rhs[key]
            };
        } else if (isArray(rhs[key])) {
            res[key] = {
                ...rhs[key]
            };
        } else {
            res[key] = rhs[key];
        }
    }
    if (!Object.keys(res).length) {
        return null;
    }
    whiteList.map(key => {
        const value = rhs[key];
        if (!res.hasOwnProperty(key) && value) {
            res[key] = value;
        }
    });
    return res;
};

export const isString = val => {
    return 'string' === typeof val || '[object String]' === Object.prototype.toString.call(val);
};

export const isNum = val => {
    return 'number' === typeof val || '[object Number]' === Object.prototype.toString.call(val);
};

export const isBool = val => {
    return true === val || false === val || '[object Boolean]' === Object.prototype.toString.call(val);
};

export const isNaN = val => {
    return 'number' === typeof val && val !== val;
};
