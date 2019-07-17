/**
 * @file XML返回数据处理工具
 * @author liangshiquan
 */
import {datasetFilter} from '../../../utils';

const WHITE_LIST_SCROLL_VIEW = '.scroll-view-compute-offset';

// 判断selectDOM是否为scrollView组件
function isScrollView(selectDom) {
    return selectDom.tagName === 'SWAN-SCROLL-VIEW';
}

function isBody(selectDom) {
    return selectDom.tagName === 'BODY';
}

/**
 * 依据属性列表获取指定属性数据返回（不包括id/class/私有属性）
 *
 * @param {Object} node 指定元素DOM
 * @param {?Array} properties 属性数组列表
 * @return {Object} 指定属性信息集合
 */
function getProperties(node, properties) {
    if (!node.sanComponent || !properties || !properties.length) {
        return {};
    }
    const vertify = /^(_|private|provide)/;
    const raw = node.sanComponent.data.raw;
    let props = {};
    properties.forEach(el => {
        // 转换成camel写法，过滤掉私有属性
        el = (el + '').replace(/-(\w)/g, (m, n) => n.toUpperCase());
        if (el === 'id' || el === 'class' || vertify.test(el)) {
            return;
        }
        raw[el] && (props[el] = raw[el]);
    });
    return props;
}

/**
 * 依据样式名列表获取指定DOM相关样式信息
 *
 * @param {Object} node 指定元素DOM
 * @param {?Array} styleList 样式名列表
 * @return {Object} 指定样式信息集合
 */
function getComputedStyles(node, styleList) {
    const style = window.getComputedStyle(node);
    let data = {};
    if (styleList && styleList.length) {
        styleList.forEach(el => {
            style[el] && (data[el] = style[el]);
        });
    }
    return data;
}

/**
 * 读取 DOMRect 中的数据
 *
 * @param  {DOMRect} domRect DOMRect
 * @return {Object}
 */
export const readBoxData = domRect => {
    return {
        top: domRect.top,
        right: domRect.right,
        bottom: domRect.bottom,
        left: domRect.left
    };
};

/**
 * 读取 DOMRect 中的数据
 *
 * @param  {DOMRect} domRect DOMRect
 * @return {Object}
 */
export const readRectData = domRect => {
    return {
        top: domRect.top,
        right: domRect.right,
        bottom: domRect.bottom,
        left: domRect.left,
        width: domRect.width,
        height: domRect.height
    };
};

/**
 * 获取 dom 节点的 dataset
 *
 * @param  {HTMLElement} node dom 节点
 * @return {Object}
 */
export const getDataSet = node => (node.sanComponent
    && node.sanComponent.data.raw
    && datasetFilter(node.sanComponent.data.raw)) || {};


/**
 * 将选择器转为自定义组件的选择器
 * 主要对 class 增加 custom-component__ 前缀
 *
 * @param  {string} selector 选择器
 * @param  {string} componentName 自定义组件名称
 * @return {string}          自定义组件的选择器
 */
export const convertToCustomComponentSelector = (selector, componentName) => {
    const selectorList = selector.split(' ');
    selectorList.forEach((selector, index) => {
        /^\./.test(selector) && !selector.startsWith(`.${componentName}__`)
            && (selectorList[index] = `.${componentName}__${selector.slice(1)}`);
    });
    return selectorList.join(' ');
};

/**
 *
 * 获取DOM节点信息数据
 *
 * @private
 * @param {HTMLElement} selectDom 选择器对应的DOM
 * @param {string} operation 调用exec前的操作类型
 * @param {Object} fields fields方法传入的指定数据
 *
 * @return {Object} 返回节点信息数据集
 */
function getOperationData(selectDom, operation, fields = {}) {
    if (!selectDom) {
        return null;
    }
    const dataset = getDataSet(selectDom);
    const selectedDataMap = {
        id: selectDom.id,
        rect: readBoxData(selectDom.getBoundingClientRect()),
        size: {
            width: selectDom.offsetWidth,
            height: selectDom.offsetHeight
        }
    };
    const effectSelectDom = isScrollView(selectDom)
        ? (selectDom.querySelector(WHITE_LIST_SCROLL_VIEW))
        : selectDom;
    const scrollLeft = isBody(effectSelectDom)
        ? (document.documentElement.scrollLeft || document.body.scrollLeft)
        : effectSelectDom.scrollLeft;
    const scrollTop = isBody(effectSelectDom)
        ? (document.documentElement.scrollTop || document.body.scrollTop)
        : effectSelectDom.scrollTop;
    const selectedScrollDataMap = {
        id: effectSelectDom.id,
        dataset: dataset,
        scrollLeft,
        scrollTop
    };

    const operationActionMap = {
        boundingClientRect: () => {
            return {
                id: selectedDataMap.id,
                dataset: dataset,
                ...selectedDataMap.rect,
                ...selectedDataMap.size
            };
        },
        fields() {
            const fieldsTrueKeys = Object.keys(fields).filter(key => fields[key]);
            const trueKeysLen = fieldsTrueKeys.length;
            if (!trueKeysLen) {
                return {};
            }
            let data = {};
            // 处理id/dataset/rect/size/scrollOffset相关
            for (let key of fieldsTrueKeys) {
                if (selectedDataMap[key]) {
                    Object.prototype.toString.call(selectedDataMap[key]).indexOf('Object') > -1
                    ? (data = {...data, ...selectedDataMap[key]})
                    : (data[key] = selectedDataMap[key]);
                }
                else if (key === 'scrollOffset') {
                    data = {...data,
                            scrollLeft: selectedScrollDataMap.scrollLeft,
                            scrollTop: selectedScrollDataMap.scrollTop
                        };
                }
                else if (key === 'dataset') {
                    data[key] = dataset;
                }
            }
            // 处理properties/computedStyle相关
            const props = getProperties(selectDom, fields.properties);
            const styles = getComputedStyles(selectDom, fields.computedStyle);
            data = {...data, ...props, ...styles};
            return data;
        },
        scrollOffset() {
            return selectedScrollDataMap;
        }
    };

    return operationActionMap[operation] && operationActionMap[operation]() || {};
}

export function getSelectData({selector, queryType, operation, fields, contextId}) {
    const rootDom = contextId ? document.querySelector('#' + contextId) : document;
    switch (queryType) {
        case 'select': {
            const selectDom = rootDom.querySelector(selector);
            return getOperationData(selectDom, operation, fields);
        }
        case 'selectAll': {
            const selectDomArr =  Array.prototype.slice.call(rootDom.querySelectorAll(selector));
            return selectDomArr.map(item => getOperationData(item, operation, fields));
        }
        case 'selectViewport': {
            let data = getOperationData(document.body, operation, fields);
            const rectArr = ['left', 'right', 'top', 'bottom'];
            rectArr.forEach(key => {
                data.hasOwnProperty(key) && (data[key] = 0);
            });
            return data;
        }
        default:
            return {};
    }
}
