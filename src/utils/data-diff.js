/**
 * @file deep diff data
 * @author yican
 */

class Diff {
    constructor(kind, path) {
        this.kind = kind;
        if (path && path.length) {
            this.path = path;
        }
    }
}

class DiffEdit extends Diff {
    constructor(path, origin, value) {
        super('E', path);
        this.lhs = origin;
        this.rhs = value;
    }
}

class DiffNew extends Diff {
    constructor(path, value) {
        super('N', path);
        this.rhs = value;
    }
}

class DiffDeleted extends Diff {
    constructor(path, value) {
        super('D', path);
        this.lhs = value;
    }
}

class DiffArray extends Diff {
    constructor(path, index, item) {
        super('A', path);
        this.index = index;
        this.item = item;
    }
}

function hashThisString(string) {
    let hash = 0;
    if (string.length === 0) {
        return hash;
    }
    for (let i = 0; i < string.length; i++) {
        let char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
}

const realTypeOf = subject => {
    let type = typeof subject;
    if (type !== 'object') {
        return type;
    }

    if (subject === Math) {
        return 'math';
    }
    else if (subject === null) {
        return 'null';
    }
    else if (Array.isArray(subject)) {
        return 'array';
    }
    else if (Object.prototype.toString.call(subject) === '[object Date]') {
        return 'date';
    }
    else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString())) {
        return 'regexp';
    }
    return 'object';
};

const getOrderIndependentHash = object => {
    let accum = 0;
    let type = realTypeOf(object);

    if (type === 'array') {
        object.forEach(function (item) {
            accum += getOrderIndependentHash(item);
        });
        let arrayString = '[type: array, hash: ' + accum + ']';
        return accum + hashThisString(arrayString);
    }

    if (type === 'object') {
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                let keyValueString = '[ type: object, key: ' + key
                                    + ', value hash: ' + getOrderIndependentHash(object[key]) + ']';
                accum += hashThisString(keyValueString);
            }
        }
        return accum;
    }

    let stringToHash = '[ type: ' + type + ' ; value: ' + object + ']';
    return accum + hashThisString(stringToHash);
};

const deepDiff = (lhs, rhs, changes, prefilter, path, key, stack, orderIndependent) => {
    changes = changes || [];
    path = path || [];
    stack = stack || [];
    let currentPath = path.slice(0);
    if (typeof key !== 'undefined' && key !== null) {
        if (prefilter) {
            if (typeof(prefilter) === 'function' && prefilter(currentPath, key)) {
                return;
            }
            else if (typeof(prefilter) === 'object') {
                if (prefilter.prefilter && prefilter.prefilter(currentPath, key)) {
                    return;
                }
                if (prefilter.normalize) {
                    const alt = prefilter.normalize(currentPath, key, lhs, rhs);
                    if (alt) {
                        lhs = alt[0];
                        rhs = alt[1];
                    }
                }
            }
        }
        currentPath.push(key);
    }

    if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
        lhs = lhs.toString();
        rhs = rhs.toString();
    }

    let ltype = typeof lhs;
    let rtype = typeof rhs;
    let i;
    let j;
    let k;
    let other;

    let ldefined = ltype !== 'undefined'
                    || (stack && (stack.length > 0) && stack[stack.length - 1].lhs
                    && Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key));
    let rdefined = rtype !== 'undefined'
        || (stack && (stack.length > 0) && stack[stack.length - 1].rhs
        && Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key));

    if (!ldefined && rdefined) {
        changes.push(new DiffNew(currentPath, rhs));
    }
    else if (!rdefined && ldefined) {
        // 为了性能优化，在删除的时候，只把对象层级大于1的压入栈，因为对象层级为1的时候，我们不能删除
        if (currentPath.length > 1) {
            changes.push(new DiffDeleted(currentPath, lhs));
        }
    }
    else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
        changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
    else if (realTypeOf(lhs) === 'date' && (lhs - rhs) !== 0) {
        changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
    else if (ltype === 'object' && lhs !== null && rhs !== null) {
        for (i = stack.length - 1; i > -1; --i) {
            if (stack[i].lhs === lhs) {
                other = true;
                break;
            }
        }
        if (!other) {
            stack.push({lhs: lhs, rhs: rhs});
            if (Array.isArray(lhs)) {
                if (orderIndependent) {
                    lhs.sort(function (a, b) {
                        return getOrderIndependentHash(a) - getOrderIndependentHash(b);
                    });

                    rhs.sort(function (a, b) {
                        return getOrderIndependentHash(a) - getOrderIndependentHash(b);
                    });
                }
                i = rhs.length - 1;
                j = lhs.length - 1;
                while (i > j) {
                    changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i--])));
                }
                while (j > i) {
                    changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, lhs[j--])));
                }
                for (; i >= 0; --i) {
                    deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack, orderIndependent);
                }
            }
            else {
                let akeys = Object.keys(lhs);
                let pkeys = Object.keys(rhs);
                for (i = 0; i < akeys.length; ++i) {
                    k = akeys[i];
                    other = pkeys.indexOf(k);
                    if (other >= 0) {
                        deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);
                        pkeys[other] = null;
                    }
                    else {
                        deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack, orderIndependent);
                    }
                }
                for (i = 0; i < pkeys.length; ++i) {
                    k = pkeys[i];
                    if (k) {
                        deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack, orderIndependent);
                    }
                }
            }
            stack.length = stack.length - 1;
        }
        else if (lhs !== rhs) {
            changes.push(new DiffEdit(currentPath, lhs, rhs));
        }
    }
    else if (lhs !== rhs) {
        if (!(ltype === 'number' && isNaN(lhs) && isNaN(rhs))) {
            changes.push(new DiffEdit(currentPath, lhs, rhs));
        }
    }
};

const observableDiff = (lhs, rhs, observer, prefilter, orderIndependent) => {
    let changes = [];
    deepDiff(lhs, rhs, changes, prefilter, null, null, null, orderIndependent);
    if (observer) {
        for (let i = 0; i < changes.length; ++i) {
            observer(changes[i]);
        }
    }
    return changes;
};

export const accumulateDiff = (lhs, rhs, prefilter, accum) => {
    const observer = (accum)
                    ? function (difference) {
                        difference && accum.push(difference);
                    }
                    : undefined;
    let changes = observableDiff(lhs, rhs, observer, prefilter);
    return (accum) ? accum : (changes.length) ? changes : undefined;
};