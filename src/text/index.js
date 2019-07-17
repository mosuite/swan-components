/**
 * @file bdml's file's base elements <text>
 * @author jiamiao(jiamiao@baidu.com)
 */
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {

    behaviors: ['userTouchEvents', 'animateEffect'],

    constructor() {
        this.oldInnerHTML = null; // 保存上一次text组件的innerHTML，用于diff判断
    },

    initData() {
        return {
            selectable: false,
            space: false
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'space', data: [false, 'ensp', 'emsp', 'nbsp']},
            {name: 'selectable', caster: typesCast.boolCast}
        ]),

        textSelectableClass() {
            return this.data.get('__selectable') ? 'text-selectable' : '';
        }
    },

    messages: {
        // text子组件完成渲染，通知父text组件
        'text:rendered'() {
            this.templateText && this.filterSpace();
        }
    },

    attached() {
        this.showText = this.ref('showText');
        this.templateText = this.ref('templateText');
        this.filterSpace();
    },

    slaveUpdated() {
        if (this.templateText.innerHTML !== this.oldInnerHTML) {
            this.nextTick(() => {
                this.filterSpace(true);
            });
        }
    },

    /**
     * 对text中的文本处理后append到真实展示的dom节点中
     */
    filterSpace() {
        // 创建一个文档碎片，防止多一层dom
        let newDocument = document.createDocumentFragment();
        const childLength = this.templateText.childNodes.length;

        for (let n = 0; n < childLength; n++) {
            let childItem = this.templateText.childNodes.item(n);
            // 若子节点为文本文档，替换之后插入文档碎片
            if (childItem.nodeType === childItem.TEXT_NODE) {
                let afterSpaceArr = this.textSpace(childItem.textContent).split('\n');
                afterSpaceArr.forEach((item, index) => {
                    index && newDocument.appendChild(document.createElement('br'));
                    newDocument.appendChild(document.createTextNode(item));
                });
            }
            // 若子节点为元素，除了swan-text标签之外，其余的都过滤掉，text组件只能嵌套text
            else if (childItem.nodeType === childItem.ELEMENT_NODE && 'SWAN-TEXT' === childItem.tagName) {
                newDocument.appendChild(childItem.cloneNode(!0));
            }
        }

        // 插入实际展示的dom里，因为如果只有一个span，以下操作会使view层找不到原本的元素，导致视图层不动态更新
        this.showText.innerHTML = '';
        this.showText.appendChild(newDocument);
        this.oldInnerHTML = this.templateText.innerHTML;

        // 向父text组件派发视图更新信息：某一个子text组件rerender，则其全部父text组件需rerender
        this.dispatch('text:rendered');
    },

    /**
     * 根据接收的space处理文本子节点中的空格
     *
     * @param {string} text 当前文本为文本文档的子节点
     * @return {string} 处理完空格后的文本
     */
    textSpace(text) {
        const space = this.data.get('__space');
        space ? ('nbsp' === space ? text = text.replace(/ /g, ' ') : 'ensp' === space
            ? text = text.replace(/ /g, ' ') : 'emsp' === space && (text = text.replace(/ /g, ' '))) : text;
        return text;
    },

    template: `<swan-text>
        <span s-ref='templateText' style="display: none;"><slot></slot></span>
        <span s-ref='showText' class="{{textSelectableClass}}"></span>
    </swan-text>`
};
