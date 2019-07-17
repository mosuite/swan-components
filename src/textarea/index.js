/**
 * @file bdml's file's base elements <textarea>
 * @author mabin(mabin03@baidu.com)
 */
import style from './index.css';
import {hexColor, isEqualObject, isString, isNum, privateKey} from '../utils';
import SwanComponent from '../swan-component';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

const casterMethod = {
    selection(attr) {
        return function () {
            const data = this.data.get(attr);
            if (isNum(data)) {
                return data;
            } else if (isString(data)) {
                return (+data ? +data : -1);
            } else if (true === data) {
                return 1;
            } else if (false === !!data) {
                return 0;
            }
            return -1;
        };
    }
};

// 粗体字号
const BOLD_FONT_SIZE = 500;

// 缺省屏幕宽度
const BASE_VIEW_WIDTH = 750;

// 缺省最小高度
const MIN_HEIGHT = 20;

// 缺省最大高度
const MAX_HEIGHT = -1;

// 用来记录当前页面已展现的 textarea 组件
const INSERTED_TEXTAREA_LIST = {};

export default {

    behaviors: ['form', 'nativeCover', 'keyboardStatus'],

    constructor() {
        this.timer = {};

        // 标记当前组件是否处于 focus 状态
        this.isFocus = false;

        this.args = null;

        this.lineCount = 1;

        this.height = MIN_HEIGHT;

        this.scale = parseFloat(BASE_VIEW_WIDTH / global.innerWidth);

        this.name = this.data.get('name');
    },

    initData() {
        return {
            id: this.id,
            value: '',
            maxlength: 140,
            placeholder: '',
            disabled: false,
            focus: false,
            autoFocus: false,
            placeholderStyle: '',
            placeholderClass: '',
            autoHeight: false,
            cursorSpacing: 0,
            fixed: false,
            cursor: -1,
            showConfirmBar: true,
            selectionStart: -1,
            selectionEnd: -1,
            adjustPosition: true,
            hidden: false,
            [privateKey]: {
                componentId: this.id
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'selectionStart', caster: casterMethod.selection},
            {name: 'selectionEnd', caster: casterMethod.selection},
            {name: 'maxlength', caster: typesCast.numCast, default: 140},
            {name: 'value', caster: typesCast.stringCast},
            {name: 'placeholder', caster: typesCast.stringCast},
            {name: 'disabled', caster: typesCast.boolCast},
            {name: 'autoHeight', caster: typesCast.boolCast},
            {name: 'autoFocus', caster: typesCast.boolCast},
            {name: 'focus', caster: typesCast.boolCast},
            {name: 'fixed', caster: typesCast.boolCast},
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'showConfirmBar', caster: typesCast.boolCast, default: true},
            {name: 'adjustPosition', caster: typesCast.boolCast, default: true},
            {name: 'cursor', caster(attr) {
                return function () {
                    const data = this.data.get(attr);
                    if (!/^-?\d+$/g.test(`${data}`)) {
                        return '';
                    }
                    return data;
                };
            }}
        ]),

        /**
         * 创建 placeholder 节点的缺省 className
         * @return {string}
         */
        getPlaceholderClass() {
            return `textarea-placeholder ${this.data.get('placeholderClass')}`;
        },

        /**
         * 创建 placeholder 节点的缺省 style
         * @return {string}
         */
        getPlaceholderStyle() {
            return `${this.data.get('placeholderStyle')};display:none;`;
        },

        /**
         * 依据 autoHeight 属性，重建 style
         * @return {string}
         */
        style() {
            const autoHeight = this.data.get('__autoHeight');
            // 过滤 rpx
            const style = SwanComponent.computed.style.call(this);
            if (!autoHeight || !style || typeof style !== 'string') {
                return style;
            }
            return style.split(';').filter(rule => !/^height:/.test(rule.trim())).join(';');
        },

        /**
         * 产出 provideData 供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },

    template: `<swan-textarea
        placeholder="{{__placeholder}}"
        focus="{{__focus}}"
        maxlength="{{__maxlength}}"
        auto-height="{{__autoHeight}}"
        value="{{__value}}"
        id="{{id}}"
        disabled="{{disabled}}"
        data-sanid="{{provideData.componentId}}"
    >
        <div class="swan-textarea-main">
            <div s-ref="placeholder"
                class="{{getPlaceholderClass}}"
                style="{{getPlaceholderStyle}}">
                {{__placeholder}}
            </div>
        </div>
    </swan-textarea>`,

    created() {
        this.nextTick(() => {
            const autoHeight = this.data.get('__autoHeight');
            if (autoHeight) {
                this.el.style.height = 'auto';
            }
            this.insertTextArea();
        });
    },

    attached() {

        /**
         * 因属性值变更而触发 updata
         * @param {string} key 属性名
         * @param {string} value 属性值
         */
        function updateByAttr(key, value) {
            this.updateTextarea({
                [key]: `${value}`
            });
        }

        // 响应 component:update, 触发 update 操作
        this.communicator.onMessage('component:update', message => {
            const component = message.data.component;

            /**
             * 不响应组件自身派发的 component:update
             */
            if (component !== this) {

                // 更新位置时，不获得焦点
                updateByAttr.apply(this, ['focus', false]);
            }
        });

        // 响应 label 触发的点击事件，以触发 update 操作
        this.communicator.onMessage('LabelTapped', message => {
            if (message.data && message.data.labelForValue === this.data.get('id')) {
                updateByAttr.apply(this, ['focus', true]);
            }
        });

        this.watch('name', name => {
            this.reRegisterFormItem(this.name);
            this.name = name;
        });
    },

    detached() {
        this.removeTextArea();
    },

    /**
     * slaveUpdated
     * @override
     */
    slaveUpdated() {
        this.nextTick(() => {
            const focus = this.data.get('__focus');
            this.updateTextarea({
                // 已展现的贴片数量为 1 时，focus 使用开发者定义的值
                focus: `${Object.keys(INSERTED_TEXTAREA_LIST).length === 1 ? focus : (this.isFocus ? focus : false)}`
            });
        });
    },

    /**
     * 设置二级回调，以响应 focus、blur、inpit、linechange、confirm 事件
     */
    setLv2Callback() {
        const self = this;
        self.callbackName = `afterInsert_${new Date() - 0}_${self.id || ''}`;
        global[self.callbackName] = function (res) {
            const date = new Date() - 0;

            // 使用正则匹配换行符
            res = JSON.parse(res.replace(/[\r\n]/g, `<${date}>`));
            const reg = new RegExp(`<${date}>`, 'g');
            const data = res.data || res;
            let {value, cursor, lineCount, height, keyboardHeight, eventName} = data;
            height = parseInt(height, 10);
            value = value.replace(reg, '\n');
            self.data.set('value', value);
            if (value.length !== 0) {
                cursor += '';
                self.data.set('cursor', cursor);
                if (self.args) {
                    self.args.cursor = cursor;
                    self.args.value = value;
                }
            }
            const eventMap = {
                focus() {
                    // 标记当前组件处于 focus 状态
                    this.isFocus = true;
                    self.trigger('focus', {
                        detail: {
                            value,
                            height: keyboardHeight
                        }
                    });
                    this.setKeyboardStatus(1);
                },
                blur() {
                    // 标记当前组件没有处于 focus 状态
                    this.isFocus = false;
                    self.trigger('blur', {
                        detail: {
                            value,
                            cursor
                        }
                    });
                    // 设置前端focus为false
                    this.data.set('focus', false);
                    this.setKeyboardStatus(0);
                },
                input() {
                    clearTimeout(this.timer.triggerInput);
                    this.timer.triggerInput = setTimeout(() => {
                        self.trigger('input', {
                            detail: {
                                value,
                                cursor
                            }
                        });
                    }, 100);
                },
                // 客户端在 文本行数变化 或者 NA 视图高度发生变化时都会执行 linechange 回调
                linechange() {
                    clearTimeout(this.timer.triggerLinechange);
                    this.timer.triggerLinechange = setTimeout(() => {
                        const autoHeight = self.data.get('__autoHeight');
                        const oldLineCount = self.lineCount;
                        const oldHeight = self.height;
                        self.lineCount = lineCount;
                        if (autoHeight) {
                            const {minHeight, maxHeight} = this.getComputedStyle();
                            // 矫正客户端计算的 NA 视图高度
                            if (height < ~~minHeight) {
                                height = ~~minHeight;
                            } else if (~~maxHeight > 0 && height > ~~maxHeight) {
                                height = ~~maxHeight;
                            }
                            self.height = height;
                            data.height = height;
                            self.args.position.height = `${height}`;
                        }
                        self.onLinechange({
                            ...data,
                            lineCountChanged: oldLineCount !== lineCount,
                            heightChangeed: oldHeight !== height
                        });
                    }, 100);
                },
                confirm() {
                    self.trigger('confirm', {
                        detail: {
                            value
                        }
                    });
                    this.setKeyboardStatus(0);
                }
            };
            eventMap[eventName].call(self);
        };
    },

    /**
     * 创建 NA 视图
     */
    insertTextArea() {
        this.setLv2Callback();

        const params = this.getCurrrentArgs();

        this.args = {
            ...params
        };

        // 标记贴片已经创建
        this.isInserted = true;

        // 更新已展现的贴片列表
        INSERTED_TEXTAREA_LIST[this.data.get('id')] = 1;

        this.boxjs.ui.open({
            name: 'swan-textarea',
            data: {
                ...params,
                cb: this.callbackName
            }
        }).then(res => {
        }).catch(err => {
            this.args = null;
            console.warn('insertTextArea::error:', err);
        });
    },

    /**
     * 更新 NA 视图
     * @param {Object} options 参数集合
     */
    updateTextarea(options = {}) {
        this.nextTick(() => {
            if (this.el && this.isInserted) {
                const params = {
                    ...this.getCurrrentArgs(),
                    ...options
                };
                const args = this.args;

                /**
                 * 如果当前贴片已获得焦点
                 * 使 args.value 和 options.value 值相同
                 * 也使 args.cursor 和 options.cursor 值相同
                 * 也使 args.focus 和 options.focus 值相同
                 * 避免因 value、 cursor、 focus 各自的 diff 而触发 update
                */
                if (this.isFocus) {
                    args.value = params.value;
                    args.cursor = params.cursor;
                    args.focus = params.focus;
                }
                if (!isEqualObject(args, params)) {
                    this.args = {
                        ...params
                    };
                    this.boxjs.ui.update({
                        name: 'swan-textarea',
                        data: {
                            ...params
                        }
                    }).then(res => {
                    }).catch(err => {
                        console.warn('updateTextarea::error:', err);
                    });
                }
            }
        });
    },

    /**
     * 删除 NA 视图
     */
    removeTextArea() {
        const id = this.data.get('id');
        if (this.el && this.isInserted) {
            this.boxjs.ui.close({
                name: 'swan-textarea',
                data: this.getCurrrentArgs()
            }).then(res => {
                this.isInserted = false;

                this.args = null;

                // 更新已展现的贴片列表
                delete INSERTED_TEXTAREA_LIST[id];

                // 销毁二级 cb 方法体及方法名
                global[this.callbackName] = null;
                this.callbackName = null;
            }).catch(err => {
                console.warn('removeTextArea::error:', err);
            });
        }
    },

    /**
     * 创建执行端能力所需的参数
     * @return {Object} 参数集合
     */
    getCurrrentArgs() {
        let {
            id,
            __disabled,
            __placeholder,
            __value,
            __maxlength,
            __focus,
            __autoFocus,
            __showConfirmBar,
            __adjustPosition,
            __fixed,
            __autoHeight,
            __cursor,
            __selectionStart,
            __selectionEnd,
            __hidden
        } = this.data.get();
        const style = this.getComputedStyle();
        const {minHeight, maxHeight} = style;
        const position = this.getElementBox();

        __value = __maxlength > -1 ? __value.substr(0, __maxlength) : __value;

        if (~~position.height < ~~minHeight) {
            position.height = minHeight;
        } else if (~~maxHeight > 0 && ~~position.height > ~~maxHeight) {
            position.height = maxHeight;
        }

        this.height = position.height;

        return {
            slaveId: `${this.slaveId}`,
            inputId: `${id}`,
            viewId: `${id}`,
            parentId: `${this.getFirstParentComponentId(this)}`,
            disabled: `${__disabled}`,
            placeholder: `${__placeholder}`,
            value: `${__value}`,
            maxLength: `${__maxlength}`,
            style,
            position,
            focus: `${__focus || __autoFocus}`,
            cursor: `${__cursor}`,
            cursorSpacing: `${style.marginBottom}`,
            selectionStart: `${__selectionStart}`,
            selectionEnd: `${__selectionEnd}`,
            showConfirmBar: `${__showConfirmBar}`,
            adjustPosition: `${__adjustPosition}`,
            fixed: `${__fixed}`,
            autoHeight: `${__autoHeight}`,
            placeholderStyle: this.getPlaceholderStyle(),
            hide: `${__hidden}`
        };
    },

    /**
     * 格式化 fontWeight，使其值在约定范围内
     * @param {Object} element dom 节点
     * @return {string} nromal 或 bold
     */
    getFontWeight(element) {
        if (!element) {
            return '';
        }
        const computedStyle = global.getComputedStyle(element);
        let fontWeight = parseInt(computedStyle.fontWeight, 10);
        if (isNaN(fontWeight)) {
            fontWeight = computedStyle.fontWeight;
        } else if (fontWeight < BOLD_FONT_SIZE) {
            fontWeight = 'normal';
        } else if (fontWeight >= BOLD_FONT_SIZE) {
            fontWeight = 'bold';
        }
        return fontWeight;
    },

    /**
     * 创建端能力参数中的 placeholder 参数
     * @return {Object} placeholder 参数
     */
    getPlaceholderStyle() {
        const $placeholder = this.ref('placeholder');

        // 防止节点移除时报错
        if (!$placeholder) {
            return {};
        }
        const computedStyle = global.getComputedStyle($placeholder);
        return {
            fontSize: `${parseInt(computedStyle.fontSize, 10) || 16}`,
            fontWeight: `${this.getFontWeight($placeholder)}`,
            color: hexColor(computedStyle.color)
        };
    },

    /**
     * 创建端能力参数中的 style 参数
     * @return {Object} style 参数
     */
    getComputedStyle() {

        // 防止节点移除时报错
        if (!this.el) {
            return {};
        }
        const computedStyle = global.getComputedStyle(this.el);
        let fontWeight = this.getFontWeight(this.el);
        const borderWidth = [
            parseFloat(computedStyle.getPropertyValue('border-top-width')),
            parseFloat(computedStyle.getPropertyValue('border-left-width'))
        ];
        let minHeight = MIN_HEIGHT;
        let maxHeight = -1;
        if (computedStyle.minHeight !== 'auto') {
            minHeight = parseFloat(computedStyle.minHeight.replace('px'));
            minHeight = minHeight < MIN_HEIGHT ? MIN_HEIGHT : minHeight;
        }
        minHeight = minHeight - borderWidth[0] - borderWidth[1] < 0 ? 0 : minHeight;
        if (computedStyle.maxHeight !== 'none') {
            maxHeight = parseFloat(computedStyle.maxHeight.replace('px'));
        }
        maxHeight = maxHeight - borderWidth[0] - borderWidth[1];
        maxHeight = maxHeight < MAX_HEIGHT ? MAX_HEIGHT : maxHeight;
        let lineHeight = parseFloat(computedStyle.lineHeight) || 20;
        let fontSize = parseFloat(computedStyle.fontSize) || 14;
        const lineSpace = Math.max(0, lineHeight - 1.2 * fontSize);
        let textAlign = computedStyle.textAlign;
        if ('start' === textAlign) {
            textAlign = 'left';
        } else if ('end' === textAlign) {
            textAlign = 'right';
        } else if (!['left', 'center', 'right'].includes(textAlign)) {
            textAlign = 'left';
        }
        return {
            minHeight: `${minHeight}`,
            maxHeight: `${maxHeight}`,
            fontWeight: `${fontWeight}`,
            fontSize: `${fontSize}`,
            lineSpace: `${lineSpace}`,
            textAlign,
            color: hexColor(computedStyle.color),
            backgroundColor: hexColor(computedStyle.backgroundColor),
            borderStyle: computedStyle.borderStyle,
            borderColor: hexColor(computedStyle.borderColor),
            borderWidth: `${parseFloat(computedStyle.borderWidth)}`,
            borderRadius: `${parseFloat(computedStyle.borderRadius)}`,
            marginBottom: `${this.data.get('cursorSpacing') || parseFloat(computedStyle.marginBottom)}`,
            padding: [
                `${parseFloat(computedStyle.paddingTop) || 0}`,
                `${parseFloat(computedStyle.paddingRight) || 0}`,
                `${parseFloat(computedStyle.paddingBottom) || 0}`,
                `${parseFloat(computedStyle.paddingLeft) || 0}`
            ],
            boxSizing: computedStyle.boxSizing,
            // 这里的 fixed 属性是为了兼容 ios 11.0.5 引入的 bug
            fixed: `${this.data.get('__fixed')}`
        };
    },

    /**
     * 触发用户绑定的事件
     * @param {string} eventName 事件名
     * @param {Object} params 事件实参
     */
    trigger(eventName, params) {
        if (this.el) {
            this.dispatchEvent(`bind${eventName}`, params);
        }
    },

    /**
     * 触发用户绑定的 linechage 事件
     * @param {Object} options 参数集合
     */
    onLinechange(options = {}) {
        this.nextTick(() => {
            const {lineCount, height, lineCountChanged, heightChangeed} = options;
            if (heightChangeed) {
                this.setElementStyle({
                    height
                });
                if (this.data.get('__autoHeight')) {
                    this.slaveUpdated();

                    // 通知其它组件需要更新 NA 视图
                    this.updateOtherComponents();
                }
            }

            // 仅文本行数发生变化时才执行 bindlinechange 方法
            lineCountChanged && this.trigger('linechange', {
                detail: {
                    height,
                    heightRpx: height * this.scale,
                    lineCount,
                    lineHeight: height / (lineCount || 1)
                }
            });
        });
    },

    /**
     * 响应 form 组件的 submit 事件
     * @override
     * @return {string} value 值
     */
    getFormValue() {
        this.isFocus = false;
        return this.data.get('__value');
    },

    /**
     * 响应 form 组件的 reset 事件
     * @override
     */
    resetFormValue() {
        this.isFocus = false;
        this.data.set('value', '');
        // 焦点不存在时，直接更新 NA 视图
        this.updateTextarea({
            value: ''
        });
    },

    /**
     * 设置 dom 节点高度
     * @param {number} height 节点高度
     */
    setElementStyle({height}) {
        const {boxSizing, borderWidth, padding} = this.getComputedStyle();
        // autoHeight 为 true 时，依据 boxSizing 计算 dom 节点的真实高度
        if (this.data.get('__autoHeight') && height) {
            if (boxSizing === 'border-box') {
                height += parseFloat(borderWidth) * 2;
            } else if (boxSizing === 'content-box') {
                height -= parseFloat(padding[0]) + parseFloat(padding[2]);
            }
            this.el.style.height = `${height}px`;
        }
    }
};
