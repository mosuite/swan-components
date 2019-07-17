/**
 * @file rich-text component, use for support user's rich-text string/Array
 * @author houyu(houyu01@baidu.com)
 */
import {addClassPrefix} from '../utils/custom-component';

// 枚举标签可设置的属性
const domAttributeReflection = {
    a: {},
    abbr: {},
    b: {},
    blockquote: {},
    br: {},
    code: {},
    col: {
        span: 'setAttr',
        width: 'setAttr'
    },
    colgroup: {
        span: 'setAttr',
        width: 'setAttr'
    },
    dd: {},
    del: {},
    div: {},
    dl: {},
    dt: {},
    em: {},
    fieldset: {},
    h1: {},
    h2: {},
    h3: {},
    h4: {},
    h5: {},
    h6: {},
    hr: {},
    i: {},
    img: {
        alt: 'setAttr',
        src: 'setAttr',
        height: 'setAttr',
        width: 'setAttr'
    },
    ins: {},
    label: {},
    legend: {},
    li: {},
    ol: {
        start: 'setAttr',
        type: 'setAttr'
    },
    p: {},
    q: {},
    span: {},
    strong: {},
    sub: {},
    sup: {},
    table: {
        width: 'setAttr'
    },
    tbody: {},
    td: {
        colspan: 'setAttr',
        rowspan: 'setAttr',
        height: 'setAttr',
        width: 'setAttr'
    },
    tfoot: {},
    th: {
        colspan: 'setAttr',
        rowspan: 'setAttr',
        height: 'setAttr',
        width: 'setAttr'
    },
    thead: {},
    tr: {},
    ul: {}
};

// 枚举所有标签可设置的属性
const commonAttributeReflection = {
    class: 'setAttr',
    style: 'setAttr'
};

// 设置标签属性
const attributeOperationList = {
    setAttr(dom, attrName, attrValue) {
        dom.setAttribute(attrName, attrValue);
    }
};

/**
 * decode html实体
 * @param {string} [content] 原字符串
 * @return {string} 反解之后的字符串
 */
const decodeEntities = (content = '') => {
    const decodeMap = {
        amp: '&',
        gt: '>',
        lt: '<',
        nbsp: ' ',
        quot: '"',
        apos: '\''
    };
    return content.replace(/&([a-zA-Z]*?);/g, (allcode, codeEntity) => {
        if (decodeMap[codeEntity]) {
            return decodeMap[codeEntity];
        }
        if (/^#[0-9]{1,4}$/.test(codeEntity)) {
            return String.fromCharCode(codeEntity.slice(1));
        }
    });
};
class DomUtils {
    constructor(san) {
        this.san = san;
    }

    /**
     * 判断是否文本节点
     * @param {Object} child 节点
     * @return {Object} 是否文本节点
     */
    isText(child = {}) {
        return (child.type && child.type.toLowerCase() === 'text')
            || child.isText === 1
            || child.textExpr;
    }

    /**
     * 将一个富文本的 item 映射为 anode 形式，最后统一以 anode 的模式进行渲染
     * @param {Object} [item] 转换前的一个富文本项
     * @return {Object} anode 结构的节点
     */
    itemToAnode(item = {}) {
        if (this.isText(item)) {
            return {isText: 1, text: item.text};
        }
        const propsIndex = [];
        item.attrs = item.attrs || {};
        for (let attr in item.attrs) {
            propsIndex.push({
                name: attr,
                raw: item.attrs[attr]
            });
        }
        return {
            tagName: item.name,
            props: {
                index: propsIndex
            },
            children: item.children
        };
    }

    /**
     * 将组件的 node 模式转换为 anode 对象
     * @param {Array} [nodes] 原始组件对象
     * @return {Array} 转换后的节点组件对象
     */
    nodeConvert(nodes = []) {
        return nodes.map(nodeItem => {
            let convertedItem = this.itemToAnode(nodeItem);
            convertedItem.children = this.nodeConvert(convertedItem.children);
            return convertedItem;
        });
    }

    /**
     * 创建转换后的节点组件对象
     * @param {Array} [nodes] 原始组件对象
     * @param {DocumentFragment} root 父节点
     * @return {Array} 转换后的节点组件对象
     */
    createFragement(nodes, root = document.createDocumentFragment()) {
        nodes.forEach(node => {
            // 如果是文本节点，则直接创建
            if (this.isText(node)) {
                const text = (node.text === undefined)
                    ? node.textExpr.value : node.text;
                const textNode = document.createTextNode(decodeEntities(text));
                return root.appendChild(textNode);
            }
            // 对于 node 节点上的所有属性，获取进行相对应的操作，其执行结果不限于 setAttribute, setProperty 等
            const attributeProccessors = domAttributeReflection[node.tagName];
            if (attributeProccessors) {
                const domEntity = document.createElement(node.tagName);
                const nodeProps = node.props.index || node.props;
                nodeProps.forEach(attrObj => {
                    const attributeOperation = attributeProccessors[attrObj.name]
                                                || commonAttributeReflection[attrObj.name];
                    if (attributeOperation) {
                        const nodeAttributeValue = decodeEntities(attrObj.raw);
                        attributeOperationList[attributeOperation](domEntity, attrObj.name, nodeAttributeValue);
                    }
                });
                // 递归进行子节点的装载
                if (node.children) {
                    this.createFragement(node.children, domEntity);
                }
                return root.appendChild(domEntity);
            }
        });
        return root;
    }

    /**
     * 创建转换后的节点组件对象
     * @param {Array} [nodes] 原始组件对象
     * @param {DocumentFragment} root 父节点
     * @return {Array} 转换后的节点组件对象
     */
    parseToFragment(nodes, root) {
        let convertedNodes = null;
        if (typeof nodes === 'string') {
            convertedNodes = this.san.parseTemplate(nodes).children;
        }
        else {
            convertedNodes = this.nodeConvert(nodes);
        }
        return this.createFragement(convertedNodes, root);
    }
}

export default {
    behaviors: ['userTouchEvents', 'noNativeBehavior'],
    initData() {
        return {
            nodes: []
        };
    },

    template: '<swan-rich-text></swan-rich-text>',

    attached() {
        this.reRenderRichText();
        this.watch('nodes', val => {
            this.reRenderRichText();
        });
    },

    reRenderRichText() {
        const domUtils = new DomUtils(this.san);
        const nodesFragment = domUtils.parseToFragment(this.data.get('nodes'));
        this.el.innerHTML = '';
        this.el.appendChild(nodesFragment);

        // 如果rich-text在自定义组件内使用, 则将其内部节点的className进行前缀添加
        this.recentOwner
        && this.recentOwner._isCustomComponent
        && this.el
        && this.el.childNodes.length
        && this.replaceCustomComponentInnerClass(this.el.childNodes);
    },

    /**
     * 自定义组件包含rich-text, 深度遍历子孙元素, 进行className前缀添加
     * @param {Array} elements - 当前层级元素list
     */
    replaceCustomComponentInnerClass(elements) {
        Array.from(elements)
            .filter(element => element.className)
            .forEach(element => {
                element.className = element.className.split(' ')
                    .filter(className => className !== '')
                    .map(className => addClassPrefix(className, this.recentOwner.componentName))
                    .join(' ');
                element.childNodes.length && this.replaceCustomComponentInnerClass(element.childNodes);
            });
    },

};