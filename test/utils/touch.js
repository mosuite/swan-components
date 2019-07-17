/**
 * @file touch工具
 * @author yangzongjun@baidu.com
 */
import TWEEN from '@tweenjs/tween.js';

let getId = (function () {
    let id = 1;
    return function () {
        return id++;
    };
})();

// 相对位置边界判断
function correctRange(val, min, max) {
    if (val < min) {
        return min;
    }
    else if (val > max) {
        return max;
    }
    return val;
}

// 创建touch对象
function getTouchObj(useRelativePosition, x, y, target) {
    let rect = target.getBoundingClientRect();
    if (useRelativePosition) {
        x = correctRange(x, 0, 100);
        y = correctRange(y, 0, 100);
        x = x / 100 * rect.width;
        y = y / 100 * rect.height;
        return new Touch({
            identifier: getId(),
            target: target,
            clientX: x + rect.left,
            clientY: y + rect.top,
            pageX: x + rect.left,
            pageY: y + rect.top
        });
    }

    return new Touch({
        identifier: getId(),
        target: target,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y
    });
}

// dispatch touch事件
function dispatchTouchEvent(target, eventType, touchList) {
    let touchEvent = new TouchEvent(eventType, {
        bubbles: true,
        cancelable: true,
        touches: touchList,
        targetTouches: touchList,
        changedTouches: touchList
    });
    target.dispatchEvent(touchEvent);
}

// 派发touchend并resovle
function dispatchTouchendAndResolve(target, touchList, resolve) {
    dispatchTouchEvent(target, 'touchend', touchList);
    resolve();
}

// 处理每个坐标的keyFrames。1. 如果数组长度大于1，则首keyFrames置为0，尾keyFrames置为100。2. 将百分比转成数字。
function dealCoordinate(coordinate) {
    if (coordinate.length > 1) {
        coordinate[0].keyFrames = '0%';
        coordinate[coordinate.length - 1].keyFrames = '100%';
        coordinate.forEach((item, index) => {
            item.keyFrames = parseInt(item.keyFrames, 10); // 把类似'0%'转成数字0
        });
    }
    return coordinate;
}

// 在给定时间从一点移动到另一点
function transition(startPos, endPos, time, target, useRelativePosition, zoomParams) {
    return new Promise((resolve, reject) => {
        let touchObj;
        let tweenGroup = new TWEEN.Group();

        new TWEEN.Tween({x: startPos.x, y: startPos.y}, tweenGroup)
            .to({x: endPos.x, y: endPos.y}, time)
            .onUpdate(pos => {
                // 单指
                if (!zoomParams) {
                    touchObj = getTouchObj(useRelativePosition, pos.x, pos.y, target);
                    dispatchTouchEvent(target, 'touchmove', [touchObj]);
                }
                // 多指
                else {
                    let touchList = [];
                    zoomParams.positionList[zoomParams.currentFingerIndex] = {x: pos.x, y: pos.y};
                    zoomParams.positionList.forEach(item => {
                        touchList.push(getTouchObj(useRelativePosition, item.x, item.y, target));
                    })
                    dispatchTouchEvent(target, 'touchmove', touchList);
                }
            })
            .start()
            .onComplete(() => {
                animate = function () {}; // cancel animate
                resolve();
            });

        // 一个animate时间段触发一次tweenGroup.update
        function animate(time) {
            requestAnimationFrame(animate);
            tweenGroup.update(time);
        }
        requestAnimationFrame(animate);

        // 超时则reject
        setTimeout(() => {
            reject();
        }, 1000 * 100);
    });
}


/**
 * 创建单个手指的touch事件
 * 参数中coordinate 为数组，长度为1时 [{x: 5, y: 0, keyFrames: '0%'}] 会分别触发一次touchstart和touchend，
 *                  长度>2时 [{x: 5, y: 0, keyFrames: '0%'}, {x: 100, y: 0, keyFrames: '100%'}] 会触发touchstart、多次touchmove和touchend
 *
 * 示例用法：
 * createSingleTouchEvent(document.body,
 *  [
 *      {x: 5, y: 5, keyFrames: '0%'},
 *      {x: 10, y: 10, keyFrames: '10%'},
 *      {x: 100, y: 100, keyFrames: '100%'}
 *  ]).then(res => {
 *      console.log('then' + res);
 *  }).catch(res => {
 *      console.log('catch' + res);
 *  }).finally(res => {
 *      console.log('finally' + res);
 *  });
 *
 * @param {DOM} target dom
 * @param {Object} coordinate 坐标
 * @param {number} options 可选参数: useRelativePosition是否使用相对路径，若为true，则coordinate坐标的值只能为0~100; totalTime为touch总时间
 * @return {Promise}
 */
export function createSingleTouchEvent(target, coordinate, options = {useRelativePosition: false, totalTime: 1000}) {
    return new Promise((resolve, reject) => {
        coordinate = dealCoordinate(coordinate);
        let touchObj = getTouchObj(options.useRelativePosition, coordinate[0].x, coordinate[0].y, target);
        dispatchTouchEvent(target, 'touchstart', [touchObj]);
        let coordinateLength = coordinate.length;
        let touchendObj = getTouchObj(
            options.useRelativePosition,
            coordinate[coordinateLength - 1].x,
            coordinate[coordinateLength - 1].y,
            target
        );

        let promise = Promise.resolve();
        if (coordinate.length > 1) {
            for (let i = 1, len = coordinate.length; i < len; i++) {
                let currentItem = coordinate[i];
                let previousItem = coordinate[i - 1];
                let time = (currentItem.keyFrames - previousItem.keyFrames) / 100 * (+options.totalTime);
                promise = promise.then(() => {
                    return transition(previousItem, currentItem, time, target, options.useRelativePosition);
                });
            }
            promise.then(() => {
                dispatchTouchendAndResolve(target, [touchendObj], resolve);
            });
        }
        else {
            dispatchTouchendAndResolve(target, [touchendObj], resolve);
        }

        // 超时则reject
        setTimeout(() => {
            reject();
        }, 1000 * 100);
    });
}

// 校验多指坐标
function isValidCoordinateParams(coordinate) {
    let canZoom = true;
    if (coordinate.length < 2) {
        canZoom = false;
    }
    coordinate.forEach(item => {
        if (item.length < 2) {
            canZoom = false;
        }
    });
    return canZoom;
}

/**
 * 创建手指>2缩放的touch事件
 * coordinate为包含n个数组的数组，[[{x: 0, y: 0}, {x: 100, y: 0}], [{x: 200, y: 0}, {x: 100, y: 0}]] 会触发touchstart、多次touchmove和touchend
 *
 * 示例用法：
* createZoomEvent(
    document.body,
    [
*     [{x: 0, y: 0, , keyFrames: '0%'}, {x: 10, y: 15, keyFrames: '90%'}, {x: 100, y: 100, keyFrames: '100%'}],
*     [{x: 100, y: 100, keyFrames: '0%'}, {x: 5, y: 5, keyFrames: '100%'}]
*   ]
* ).then(res => {
*     console.log('then' + res);
* }).catch(res => {
*     console.log('catch' + res);
* }).finally(res => {
*     console.log('finally' + res);
* });
 *
 * @param {DOM} target dom
 * @param {Object} coordinate 坐标
 * @param {number} options 可选参数
 * @return {Promise}
 */
export function createZoomEvent(target, coordinate, options = {useRelativePosition: false, totalTime: 1000}) {
    if (!isValidCoordinateParams(coordinate)) {
        return Promise.reject();
    }
    coordinate.forEach(item => {
        item = dealCoordinate(item);
    });

    return new Promise((resolve, reject) => {
        let touchList = [];
        let promiseList = [];
        let positionList = []; // 实时位置列表
        coordinate.forEach(item => {
            touchList.push(getTouchObj(options.useRelativePosition, item[0].x, item[0].y, target));
            promiseList.push(Promise.resolve());
            positionList.push({x: item[0].x, y: item[0].y});
        });
        dispatchTouchEvent(target, 'touchstart', touchList);

        coordinate.forEach((finger, fingerIndex) => {
            for (let i = 1, len = finger.length; i < len; i++) {
                let currentItem = finger[i];
                let previousItem = finger[i - 1];
                let time = (currentItem.keyFrames - previousItem.keyFrames) / 100 * (+options.totalTime);
                let currentFingerPromise = promiseList[fingerIndex];
                promiseList[fingerIndex] = currentFingerPromise.then(() => {
                    return transition(previousItem, currentItem, time, target, options.useRelativePosition,
                    {positionList: positionList, currentFingerIndex: fingerIndex});
                });
            }
        });
        Promise.all(promiseList).then(() => {
            let touchList = [];
            coordinate.forEach(item => {
                touchList.push(
                    getTouchObj(options.useRelativePosition, item[item.length - 1].x, item[item.length - 1].y, target)
                );
            });
            dispatchTouchEvent(target, 'touchend', touchList);
            resolve();
        });

        // 超时则reject
        setTimeout(() => {
            reject();
        }, 1000 * 100);
    });
}
