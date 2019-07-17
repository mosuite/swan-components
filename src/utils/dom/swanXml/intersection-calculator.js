/**
 * @file Intersection Observer Calculator
 * @author wuxiaopan(wuxiaopan@baidu.com)
 */

import {getDataSet, readRectData} from './parseDataUtil';

/**
 * 计算相交区域
 *
 * @param  {Object} oneRect  DOMRect
 * @param  {Object} anotherRect 另一个 DOMRect
 * @return {Object} 相交结果
 */
const computeInterSection = (oneRect, anotherRect) => {
    let intersectionRes = {
        left: Math.max(oneRect.left, anotherRect.left),
        top: Math.max(oneRect.top, anotherRect.top),
        right: Math.min(oneRect.right, anotherRect.right),
        bottom: Math.min(oneRect.bottom, anotherRect.bottom),
        width: 0,
        height: 0
    };
    intersectionRes.right > intersectionRes.left
        ? intersectionRes.width = intersectionRes.right - intersectionRes.left
        : intersectionRes.right = intersectionRes.left = intersectionRes.bottom = intersectionRes.top = 0;

    intersectionRes.bottom > intersectionRes.top
        ? intersectionRes.height = intersectionRes.bottom - intersectionRes.top
        : intersectionRes.right = intersectionRes.left = intersectionRes.bottom = intersectionRes.top = 0;

    return intersectionRes;
};

/**
 * 计算所有 relatives 的交集
 *
 * @param  {Array} relatives observer的所有relativeInfo
 * @return {Object}  相交结果 {left, right, top, bottom, width, height}
 */
const computeRelativesIntersection = relatives => {
    let clientWidth = document.documentElement.clientWidth;
    let clientHeight = document.documentElement.clientHeight;
    let intersectionRes;

    for (let i = 0; i < relatives.length; i++) {
        let {node, margins} = relatives[i];
        let nodeRect = node
            ? node.getBoundingClientRect()
            : {
                left: 0,
                top: 0,
                right: clientWidth,
                bottom: clientHeight,
                width: clientHeight,
                height: clientHeight
            };
        let currentIntersection = {
            left: nodeRect.left - margins.left,
            top: nodeRect.top - margins.top,
            right: nodeRect.right + margins.right,
            bottom: nodeRect.bottom + margins.bottom
        };
        intersectionRes = intersectionRes
            ? computeInterSection(intersectionRes, currentIntersection)
            : currentIntersection;
    }

    return intersectionRes;
};

/**
 * 计算 observer 是否达到相交状态
 *
 * @param  {Object} observer
 * @param  {Object} observer.targetNode 观察的节点
 * @param  {Object} observer.relatives relativeInfo
 * @param  {Object} observer.thresholds 相交阈值
 * @param  {Object} observer.currentRatio 目前相交比例
 * @param  {Object} observer.cb 达到相交条件后的回调
 * @return {undefined}
 */
export const computeObserverIntersection = observer => {
    let {
        targetNode,
        relatives,
        thresholds,
        cb
    } = observer;
    let previousRatio = observer.currentRatio;
    let relativesIntersection = computeRelativesIntersection(relatives);
    let targetNodeRect = targetNode.getBoundingClientRect();
    let intersectionRect = computeInterSection(relativesIntersection, targetNodeRect);

    /* eslint-disable max-len */
    let currentRatio = intersectionRect.width * intersectionRect.height / (targetNodeRect.width * targetNodeRect.height);
    observer.currentRatio = currentRatio;

    // 相交比例变化时 判断是否满足阈值条件
    let intersectionState;
    currentRatio !== previousRatio && thresholds.forEach(threshold => {
        if (intersectionState) {
            return false;
        }
        currentRatio <= threshold && previousRatio >= threshold
            ? (intersectionState = true)
            : currentRatio >= threshold && previousRatio <= threshold && (intersectionState = true);
    });

    intersectionState && cb.call(targetNode, {
        id: targetNode.id,
        dataset: getDataSet(targetNode),
        time: Date.now(),
        boundingClientRect: readRectData(targetNodeRect),
        intersectionRatio: currentRatio,
        intersectionRect: readRectData(intersectionRect),
        relativeRect: relativesIntersection
    });
};
