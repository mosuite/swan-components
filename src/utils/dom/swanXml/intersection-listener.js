/**
 * @file Intersection Observer Listener
 * @author wuxiaopan(wuxiaopan@baidu.com)
 */

import {computeObserverIntersection} from './intersection-calculator';
import {convertToCustomComponentSelector} from './parseDataUtil';

/**
 * 添加 observer 保存在 observerMap 中
 *
 * @param  {Object} params       observer 相关信息
 * @param  {Object} communicator
 * @param  {Object} observerMap  存储所有 observer 的对象
 * @return {undefined}
 */
export const addIntersectionObserver = (params, communicator, observerMap) => {
    let {slaveId, reqId, relativeInfo, options, targetSelector, contextId, componentName} = params.value;
    const rootDom = contextId ? document.querySelector(`#${contextId}`) : document;
    const observerId = Math.floor(4294967296 * (1 + Math.random())).toString(16).slice(1);

    // 获取所有的相对节点
    let relatives = [];
    relativeInfo.forEach(item => {
        if (contextId && item.selector) {
            item.selector = convertToCustomComponentSelector(item.selector, componentName);
        }

        let node = item.selector == null ? null : rootDom.querySelector(item.selector);
        /* eslint-disable max-len */
        item.selector == null || node
            ? relatives.push({
                node,
                margins: item.margins
            })
            : console.warn(`Node "${item.selector}" is not found. The relative node for intersection observer will be ignored.`);
    });

    // 获取需要观察的目标节点
    let targetNodes = [];
    contextId && (targetSelector = convertToCustomComponentSelector(targetSelector, componentName));
    if (options.selectAll) {
        targetNodes = rootDom.querySelectorAll(targetSelector);
    } else {
        let target = rootDom.querySelector(targetSelector);
        target && targetNodes.push(target);
    }
    targetNodes.length || console.warn(`Node "${targetSelector}" is not found. Intersection observer will not trigger.`);

    targetNodes.forEach((targetNode, index) => {
        let subObserveId = `${observerId}@${index}`;
        observerMap[subObserveId] = {
            targetNode,
            relatives,
            thresholds: options.thresholds,
            currentRatio: options.initialRatio,
            cb(res) {
                communicator.sendMessage(
                    'master',
                    {
                        type: 'responseComponentObserver',
                        slaveId: params.slaveId,
                        value: {
                            reqId,
                            data: res
                        }
                    }
                );
            }
        };
        requestAnimationFrame(function () {
            computeObserverIntersection(observerMap[subObserveId]);
        });
    });

    communicator.sendMessage(
        'master',
        {
            type: 'responseComponentObserver',
            slaveId,
            value: {
                reqId,
                observerId
            }
        }
    );
};

/**
 * 从 observerMap 中移除某个 observer
 *
 * @param  {Object} params       参数
 * @param  {Object} communicator
 * @param  {Object} observerMap  存储所有 observer 的对象
 * @return {undefined}
 */
export const removeIntersectionObserver = (params, communicator, observerMap) => {
    let {slaveId, reqId, observerId} = params.value;
    for (let observerKey in observerMap) {
        observerKey.match(observerId) && delete observerMap[observerKey];
    }
    communicator.sendMessage(
        'master',
        {
            type: 'responseComponentObserver',
            slaveId,
            value: {
                reqId,
                reqEnd: true
            }
        }
    );
};
