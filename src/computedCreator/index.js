/**
 * @file 组件中数据校验的方法合集
 * @author jiamiao(jiamiao@baidu.com)
 */

import {isString, isNum, isBool, isArray} from '../utils';

export const typesCast = {
    stringCast(attr, defaultVal = '') {
        return function () {
            const data = this.data.get(attr);
            if (isString(data)) {
                return data;
            }
            else if (isNum(data)) {
                return '' + data;
            }
            return defaultVal;
        };
    },
    numCast(attr, defaultVal = 0) {
        return function () {
            const data = this.data.get(attr);
            if (isNum(data)) {
                return data;
            }
            else if (isString(data)) {
                return Number.isNaN(+data) ? defaultVal : +data;
            }
            return defaultVal;
        };
    },
    arrayCast(attr, defaultVal = []) {
        return function () {
            const data = this.data.get(attr);
            return isArray(data) ? data : defaultVal;
        };
    },
    boolCast(attr, defaultVal = false) {
        return function () {
            const data = this.data.get(attr);
            if (isBool(data)) {
                return data;
            }
            else if (isString(data) || isNum(data)) {
                return !!data && data !== 'false';
            }
            return defaultVal;
        };
    },
    oneOf(attr, datas) {
        return function () {
            const data = this.data.get(attr);
            return datas.includes(data) ? data : datas[0];
        };
    },
    oneOfType(attr, types, defaultVal) {
        const checkedMap = {
            [this.numCast]: isNum,
            [this.stringCast]: isString,
            [this.boolCast]: isBool,
            [this.arrayCast]: isArray
        };
        return function () {
            const data = this.data.get(attr);
            for (let i = 0; i < types.length; i++) {
                if (checkedMap[types[i]](data)) {
                    return data;
                }
                if (types.length - 1 === i) {
                    return types[0](attr, defaultVal).call(this);
                }
            }
        };
    }
};

export const internalDataComputedCreator = function (creatorArray) {
    return creatorArray.reduce((perv, current) => {
        if (current.data) {
            const name = current.name;
            perv[`__${name}`] = typesCast.oneOf(name, current.data);
        }
        else {
            const {name, caster} = current;
            if ('[object Array]' === Object.prototype.toString.call(caster)) {
                perv[`__${name}`] = typesCast.oneOfType(name, caster, current.default);
            }
            else {
                perv[`__${name}`] = caster(name, current.default);
            }
        }
        return perv;
    }, {});
};
