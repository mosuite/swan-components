/**
 * @file bdml's file's base elements <input>
 * @author houyu(houyu01@baidu.com)
 *         qiaolin(qiaolin@baidu.com)
 *         mabin(mabin03@baidu.com)
 */
import style from './index.css';
import {computedStyle, isEqualObject, isString, isNum, privateKey} from '../utils';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {addClassPrefix} from '../utils/custom-component';
import {getElementBox} from "../utils/dom";

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

export default {
    behaviors: ['form', 'noNativeBehavior', 'keyboardStatus'],
    constructor(props) {
        this.name = this.data.get('name');
    },
    initData() {
        return {
            hidden: false,
            value: '',
            disabled: false,
            maxlength: 140,
            password: false,
            cursorSpacing: '0',
            cursor: '',
            selectionStart: -1,
            selectionEnd: -1,
            adjustPosition: true,
            confirmType: 'done',
            confirmHold: false,
            focus: false,
            placeholderClass: style['input-placeholder'],
            placeholderComputedStyle: [],
            id: this.id,
            [privateKey]: {
                componentId: this.id,
                isIos: this.swaninterface.boxjs.platform.isIOS(),
                placeholderValue: ''
            },
            scrollviewId: this.id + '-scrollviewid',
            containerA: 'overflow: scroll; -webkit-overflow-scrolling: touch;',
            containerAinner: 'width: 100%; height:' + screen.height + 'px;',
        };
    },
    computed: {
        ...internalDataComputedCreator([
            {name: 'type', data: ['text', 'number', 'digit', 'idcard']},
            {name: 'confirmType', data: ['done', 'send', 'search', 'next', 'go']},
            {name: 'selectionStart', caster: casterMethod.selection},
            {name: 'selectionEnd', caster: casterMethod.selection},
            {name: 'value', caster: typesCast.stringCast},
            {name: 'placeholder', caster: typesCast.stringCast},
            {name: 'hidden', caster: typesCast.boolCast},
            {name: 'password', caster: typesCast.boolCast},
            {name: 'focus', caster: typesCast.boolCast},
            {name: 'disabled', caster: typesCast.boolCast},
            {name: 'confirmHold', caster: typesCast.boolCast},
            {name: 'adjustPosition', caster: typesCast.boolCast, default: true},
            {name: 'cursor', caster(attr) {
                    return function () {
                        const data = this.data.get(attr);
                        if (!/^-?\d+$/g.test(`${data}`)) {
                            return '';
                        }
                        return data;
                    };
                }},
            {name: 'maxlength', caster: typesCast.numCast, default: 140}
        ]),

        getStyle() {
            let style = this.data.get('style');
            const hidden = this.data.get('__hidden');
            return style += hidden ? ';display:none;' : '';
        },

        /**
         * 创建 type 属性的缺省值
         * @return {string}
         */
        privateType() {
            return this.data.get('__password') ? 'password' : this.data.get('__type') || 'text';
        },

        /**
         * 创建用于显示在组件的文本
         * @return {string}
         */
        showValue() {
            const __maxlength = this.data.get('__maxlength');
            let value = this.data.get('__value');
            value = __maxlength > 0 ? value.substr(0, __maxlength) : value;
            const dot = this.data.get(`${privateKey}.isIos`) ? new Array(value.length + 1).join('●')
                : new Array(value.length + 1).join('•');
            return this.data.get('__password') && value ? dot : value || '';
        },

        /**
         * 创建私有属性，供模板使用
         * @return {Object} provideData
         */
        provideData() {
            return this.data.get(privateKey);
        }
    },
    template: `<swan-input type="{{privateType}}"
        focus="{{__focus}}"
        cursor="{{__cursor}}"
        on-click="showNativeInput()"
        value="{{__value}}"
        style="{{getStyle}}"
        id="{{id}}"
        name="{{name}}"
        data-sanid="{{provideData.componentId}}"
    >
        <div class="swan-input-main">
            <div s-ref="placeholder"
                showplaceholder="{{__value.length === 0 && provideData.placeholderValue.length === 0}}"
                class="input-placeholder"
                style="{{placeholderComputedStyle}}">
                {{__placeholder}}
            </div>
            <div s-ref="inputValue"
                class="${style['input-value']}"
                style="{{inputTextStyle}}">
                {{showValue}}
            </div>
            <div s-ref="stylecompute"
                class="input-stylecompute {{placeholderClass}}"
                style="{{placeholderStyle}}"></div>
        </div>
        <div class="swan-video-container" 
              s-ref="container"   style="{{containerA}}">
                  <div id="{{scrollviewId}}" 
                  style="{{containerAinner}}">video</div>
          </div>
    </swan-input>`,

    created() {
        // 自定义组件中input placeholder样式类前缀添加
        // todo 统一处理
        this.replaceCustomComponentInnerClass();
        this.nextTick(() => {
            this.setPlaceholderStyle();
            this.name = name;

            // 自动获得焦点
          //  this.data.get('__focus') && this.showNativeInput();
            this.focusChange();
            this.valueChange();
            this.nameChange();
            this.placeholderStyleChange();
        });
    },
    attached() {
        this.nextTick(() => {
            window.requestAnimationFrame(() => {
                this.insertContainer();
            });
        });
    },
    insertContainer() {
        const elementBox = getElementBox(this.el);
        let position = {
            width: `${parseInt(elementBox.width, 10)}`,
            height: `${parseInt(elementBox.height, 10)}`,
            left: `${parseInt(elementBox.left, 0)}`,
            top: `${parseInt(elementBox.top, 0)}`
        };
        try {
            this.boxjs.insertContainer({
                slaveId: this.slaveId,
                containerId: this.data.get('scrollviewId'),
                position: position,
                scrollHeight: screen.height


            }).then(e => {
                if (e.isScrollViewFound) {
                    this.showNativeInput()
                }

            }).catch(err => {

                // console.warn('video open fail', err);
            });
        }
        catch (e) {
            // console.log(e);
        }
    },
    detached() {
        this.closeNativeInput();
    },

    /**
     * slaveRendered
     * @override
     */
    slaveRendered() {
        this.updateNativeInput();
    },

    /**
     * 自定义组件中input placeholder样式类前缀添加
     */
    replaceCustomComponentInnerClass() {
        let placeholderClass = this.data.get('placeholderClass');
        if (this.recentOwner && this.recentOwner._isCustomComponent && placeholderClass) {
            const resplcedClass = addClassPrefix(placeholderClass, this.recentOwner.componentName);
            this.data.set('placeholderClass', resplcedClass);
        }
    },

    /**
     * 监听焦点变化，以创建或删除 NA 视图
     */
    focusChange() {
        this.watch('__focus', __focus => {
            // __focus ? this.showNativeInput() : this.closeNativeInput();
        });
    },

    /**
     * 监听 value 变化，以变更 placeholderValue
     */
    valueChange() {
        this.watch('__value', __value => {
            this.data.set(`${privateKey}.placeholderValue`, __value);
        });
    },

    /**
     * 监听 placeholder-class、placeholder-style 变化，以变更 placeholder 的样式
     */
    placeholderStyleChange() {
        this.watch('placeholderStyle', () => {
            this.nextTick(() => {
                this.setPlaceholderStyle();
            });
        });
        this.watch('placeholderClass', () => {
            this.nextTick(() => {
                this.replaceCustomComponentInnerClass();
                this.setPlaceholderStyle();
            });
        });
    },

    /**
     * 监听 name 变化，以响应 name 的变更
     */
    nameChange() {
        this.watch('name', name => {
            this.reRegisterFormItem(this.name);
            this.name = name;
        });
    },

    /**
     * 创建 NA 视图
     */
    showNativeInput() {
        if (!this.isOpened && !this.data.get('__disabled')) {

            // 创建二级回调的函数名及函数体
            this.callbackName = `inputCallback_${new Date() - 0}_${this.id || ''}`;
            global[this.callbackName] = args => this.inputCallback.call(this, args);

            const params = {
                ...this.getCurrentInputArgs()
            };

            // 标记贴片已经创建
            this.isOpened = true;
            this.args = {
                ...params
            };

            // 使用端能力创建贴片
            this.boxjs.ui.open({
                name: 'swan-input',
                data: {
                    ...params,
                    parentId: this.data.get('scrollviewId'),
                    cb: this.callbackName
                }
            }).then(() => {

                // 设置前端组件的文本为不可见状态
                this.setInputTextStyle({
                    visibility: 'hidden'
                });
            }).catch(() => {
                this.resetFormValue();

                // 设置前端组件的文本为可见状态
                this.setInputTextStyle({
                    visibility: 'visible'
                });

                this.resetData();
            });
        }
    },

    /**
     * 设置 dom 节点的文本样式
     * @param {Object} options 文本样式
     */
    setInputTextStyle(options = {}) {
        const res = [];
        Object.keys(options).map(key => {
            res.push(`${key}: ${options[key]}`);
        });
        res.length && this.data.set('inputTextStyle', res.join(';'));
    },

    /**
     * 更新 NA 视图
     * @param {string} value 需要在贴片中显示的文本
     */
    updateNativeInput() {
        if (this.el && this.isOpened) {
            const params = this.getCurrentInputArgs();
            // 使用端能力更新贴片
            if (!isEqualObject(this.args, params)) {
                this.args = {
                    ...params
                };
                this.boxjs.ui.update({
                    name: 'swan-input',
                    data: {
                        ...params,
                        parentId: this.data.get('scrollviewId')
                    }
                });
            }
        }
    },

    /**
     * 删除 NA 视图
     * @return {Promise} 端能力 Promise
     */
    closeNativeInput() {
        if (this.isOpened) {

            // 使用端能力删除贴片
            return this.boxjs.ui.close({
                name: 'swan-input',
                data: {
                    ...this.getCurrentInputArgs(),
                    parentId: this.data.get('scrollviewId')
                }
            }).then(() => {
                this.resetData();
            });
        }
    },

    /**
     * 重置组件状态
     * @param {boolean} holdArgs 是否保留 args 记录
     */
    resetData() {
        if (this.isOpened) {
            // 标记贴片没有创建
            this.isOpened = false;

            // 销毁二级回调的函数名及函数体
            global[this.callbackName] = null;
            this.callbackName = null;
            this.args = null;
        }
    },

    /**
     * 创建执行端能力所需的参数
     * @return {Object} 参数对象
     */
    getCurrentInputArgs() {
        let {
            id,
            __type,
            __value,
            __maxlength,
            __password,
            cursorSpacing,
            __cursor,
            __focus,
            __placeholder,
            __confirmHold,
            __hidden,
            __confirmType,
            __selectionStart,
            __selectionEnd,
            __adjustPosition
        } = this.data.get();
        const {style, position} = computedStyle(this);

        style.padding = style.padding.map(value => `${value}`);

        __value = __maxlength > 0 ? __value.substr(0, __maxlength) : __value;

        return {
            id: `${this.id}`,
            slaveId: this.slaveId,
            viewId: `${this.id}`,
            type: __type,
            value: __value,
            maxLength: `${__maxlength}`,
            password: `${__password || 'password' === __type ? 1 : 0}`,
            style,
            position,
            cursorSpacing: `${cursorSpacing}`,
            cursor: `${__cursor}`,
            focus: `${__focus ? 1 : 0}`,
            hide: `${__hidden}`,
            placeholder: `${__placeholder}`,
            placeholderStyle: this.getPlaceholderStyle(),
            confirmHold: `${__confirmHold ? 1 : 0}`,
            confirmType: `${__confirmType}`,
            selectionStart: `${__selectionStart}`,
            selectionEnd: `${__selectionEnd}`,
            adjustPosition: `${__adjustPosition ? 1 : 0}`
        };
    },

    /**
     * 设置二级回调，以响应 change、placeholder、blur、confirm 事件
     * @param {string} res 操作信息
     */
    inputCallback(res) {
        const resData = JSON.parse(decodeURIComponent(JSON.parse(res).data));
        let {value, cursorOffset, keyboardHeight, keyCode, eventName} = resData;
        const eventMap = {
            focus() {
                this.data.set('value', value);
                this.args.value = `${value}`;
                // 触发 bindfocus
                this.trigger('focus', {
                    detail: {
                        value,
                        height: keyboardHeight
                    }
                });
                this.setKeyboardStatus(1);
            },
            // ios和安卓都在输入时触发
            // ios在系统默认中文输入法下，输入中文拼音的过程，不会触发，选中中文后再触发
            change() {
                this.data.set('value', value);
                this.args.value = `${value}`;
                if (isNum(cursorOffset)) {
                    this.data.set('cursor', cursorOffset);
                    this.args.cursor = `${cursorOffset}`;
                }
                const params = {
                    detail: {
                        value,
                        cursor: cursorOffset,
                        keyCode
                    }
                };
                this.trigger('input', params);
                this.trigger('change', params);
            },
            // IOS下输入会一直触发placeholder, 安卓下不会触发
            placeholder() {
                this.data.set(`${privateKey}.placeholderValue`, value);
                // 设置前端组件的文本为不可见状态
                this.setInputTextStyle({
                    visibility: 'hidden'
                });
            },
            blur() {
                this.trigger('blur', {
                    detail: {
                        value
                    }
                });

                // 设置前端组件的文本为可见状态
                this.setInputTextStyle({
                    visibility: 'visible'
                });
                // this.resetData();

                // 标记贴片没有创建
                this.isOpened = false;
                // 设置前端focus为false
                this.data.set('focus', false);
                this.setKeyboardStatus(0);
            },
            // ios 端执行 bindconfirm 时先触发 confirm 再出发 blur
            // android 端执行 bindconfirm 时先触发 blur 再出发 confirm
            // 因此不能在这两个回调中 resetData
            confirm() {
                this.data.set('value', value);
                this.args.value = `${value}`;
                this.trigger('confirm', {
                    detail: {
                        value
                    }
                });

                if (!this.data.get('__confirmHold')) {
                    // 设置前端组件的文本为可见状态
                    this.setInputTextStyle({
                        visibility: 'visible'
                    });
                    // this.resetData();

                    // 标记贴片没有创建
                    this.isOpened = false;
                    this.setKeyboardStatus(0);
                }
            }
        };
        eventMap[eventName].call(this);
    },

    /**
     * 获取 placehoder 节点的样式集合
     * @return {Objcet} 样式集合
     */
    getPlaceholderStyle() {
        const $stylecompute = this.ref('stylecompute');
        if (!$stylecompute) {
            return {};
        }
        const cssStyle = global.getComputedStyle($stylecompute);
        return {
            'font-size': `${cssStyle.fontSize || '16px'}`,
            'font-weight': cssStyle.fontWeight || 'normal',
            'color': cssStyle.color,
            'text-align': cssStyle.textAlign
        };
    },

    /**
     * 设置 placehoder 节点的样式
     */
    setPlaceholderStyle() {
        const placeholderStyle = this.getPlaceholderStyle();
        let arrStyle = [];
        for (let key in placeholderStyle) {
            arrStyle.push(`${key}: ${placeholderStyle[key]}`);
        }
        this.data.set('placeholderComputedStyle', `${arrStyle.join(';')};`);
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
     * 响应 form 组件的 submit 事件
     * @override
     * @return {string} value 值
     */
    getFormValue() {
        return this.data.get('__value');
    },

    /**
     * 响应 form 组件的 reset 事件
     * @override
     */
    resetFormValue() {
        this.data.set('value', '');
    }
};
