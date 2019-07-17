/**
 * @file swan component's decorator
 * @author houyu(houyu01@baidu.com)
 */
import {
    noop,
    computeDistance,
    attrValBool,
    isEqualObject,
    hexColor,
    getCoordinatePairFromMatrixStr
} from '../utils';
import {TOUCH_EVENTS_NAME} from '../utils/constant';
import {animationEffect} from '../utils/animation';
import {eventUtils, hasCustomEvent} from '../utils/event';
// 长按时长
const LONG_PRESS_TIME_THRESHOLD = 350;
// 点击容差触发距离
const TAP_DISTANCE_THRESHOLD = 10;
// 处理含有disabled属性的标签
const HAS_DISABLED_TAG = ['button', 'input', 'checkbox', 'picker', 'radio', 'slider', 'textarea', 'switch'];
// 手势事件是否满足执行条件
const eventExecCondition = function (e) {
    if (HAS_DISABLED_TAG.indexOf(this.subTag) > -1 && attrValBool(this.data.get('disabled'))) {
        return false;
    }
    return true;
};
// 键盘状态： 1 - 键盘弹起；0 - 键盘收起
let KEYBOARD_STATUS = 0;
const behaviorMap = {
    keyboardStatus: {
        methods: {
            setKeyboardStatus(originMethod = noop, status) {
                KEYBOARD_STATUS = status;
                return originMethod.call(this, status);
            }
        }
    },
    form: {
        methods: {
            attached(originMethod = noop, ...args) {
                this.registerFormItem();
                return originMethod.call(this, ...args);
            },

            detached(originMethod = noop, ...args) {
                this.unRegisterFormItem();
                return originMethod.call(this, ...args);
            },

            getFormValue(originMethod) {
                if (!originMethod) {
                    return this.el.value;
                }
                return originMethod.call(this);
            },

            resetFormValue(originMethod) {
                if (!originMethod) {
                    return (this.el.value = null);
                }
                return originMethod.call(this);
            },

            registerFormItem(originMethod = noop, name = this.data.get('name')) {
                this.dispatch('form:register', {
                    target: this,
                    name
                });
                return originMethod.call(this, name);
            },

            unRegisterFormItem(originMethod = noop, name = this.data.get('name')) {
                this.dispatch('form:unregister', {
                    target: this,
                    name
                });
                return originMethod.call(this, name);
            },

            reRegisterFormItem(originMethod = noop, name = this.name || '') {
                this.unRegisterFormItem(name);
                this.registerFormItem();
                return originMethod.call(this, name);
            }
        }
    },

    userTouchEvents: {
        methods: {
            onTapevent(originMethod = noop, $event, capture) {
                if (!eventExecCondition.call(this, $event)) {
                    return;
                }
                const prefix = capture ? 'capture' : '';
                let touchRelation = this.touchRelation;
                if (this.__fingerCount === 1) {
                    // 键盘弹起时，不校验 touchstart 与 touchend 之间的距离，防止 ios 端的 tap 事件无法触发
                    if (computeDistance(touchRelation.end, touchRelation.start) < TAP_DISTANCE_THRESHOLD
                        || !this.__computeDistanceWhenTap) {
                        this.fire(prefix + 'bindtap', $event);
                    }
                }

            },

            onlongTapevent(originMethod = noop, $event, capture) {
                if (!eventExecCondition.call(this, $event)) {
                    return;
                }

                const prefix = capture ? 'capture' : '';
                let touchRelation = this.touchRelation;
                const bindEvents = Object.keys(this.listeners);
                if (touchRelation.start && computeDistance(touchRelation.start, touchRelation.start)
                    > TAP_DISTANCE_THRESHOLD) {
                    return false;
                }
                if (this.__fingerCount === 1) {
                    // longpress事件优先级比longtap高，若开发者绑定了longpress和longtap，只会触发longpress
                    if (bindEvents.includes(prefix + 'bindlongpress')) {
                        this.fire(prefix + 'bindlongpress', $event);
                    }
                    else if (bindEvents.includes(prefix + 'bindlongtap')) {
                        this.fire(prefix + 'bindlongtap', $event);
                    }
                    this.__computeDistanceWhenTap = true;
                }
            },
            onTouchEnd(originMethod = noop, $event, capture) {
                // 组件的 touchend 事件会触发两次
                this.__touchEndTimes = this.__touchEndTimes ? this.__touchEndTimes : 0;
                this.__touchEndTimes++;
                if (!eventExecCondition.call(this, $event)) {
                    return;
                }
                const prefix = capture ? 'capture' : '';
                clearTimeout(this[`__${prefix}longpressTimer`]);
                let touchRelation = this.touchRelation;
                touchRelation.end = {
                    x: $event.changedTouches[0].screenX,
                    y: $event.changedTouches[0].screenY,
                    time: +new Date()
                };
                if (this.__fingerCount === 1
                    && touchRelation.end.time - touchRelation.start.time < LONG_PRESS_TIME_THRESHOLD) {
                        // 键盘弹起时，不校验 touchstart 与 touchend 之间的距离，防止 ios 端的 tap 事件无法触发
                    if (computeDistance(touchRelation.end, touchRelation.start) < TAP_DISTANCE_THRESHOLD
                        || !this.__computeDistanceWhenTap) {
                        'function' === typeof this.onTap && this.onTap($event);
                    }
                }
                this.fire(prefix + 'bindtouchend', $event);
                if (this.__touchEndTimes >= 2) {
                    delete this.__touchEndTimes;
                    this.__computeDistanceWhenTap = true;
                }
                return originMethod.call(this, $event, capture);
            },

            onTouchcancel(originMethod = noop, $event, capture) {
                if (!eventExecCondition.call(this, $event)) {
                    return;
                }
                const prefix = capture ? 'capture' : '';
                this.fire(prefix + 'bindtouchcancel', $event);
                return originMethod.call(this, $event, capture);
            },

            onTouchStart(originMethod = noop, $event, capture) {
                if (!eventExecCondition.call(this, $event)) {
                    return;
                }
                // 键盘弹起时，不校验 touchstart 与 touchend 之间的距离，防止 ios 端的 tap 事件无法触发
                this.__computeDistanceWhenTap = !KEYBOARD_STATUS;
                // 修改为targetTouches绑定事件的那个结点上的触摸点的集合列表
                this.__fingerCount = $event.targetTouches.length;
                const prefix = capture ? 'capture' : '';
                this.touchRelation.start = {
                    x: $event.changedTouches[0].screenX,
                    y: $event.changedTouches[0].screenY,
                    time: +new Date()
                };
                this.fire(prefix + 'bindtouchstart', $event);
                return originMethod.call(this, $event, capture);
            },

            onTouchMove(originMethod = noop, $event, capture) {
                if (HAS_DISABLED_TAG.indexOf(this.subTag) > -1 && attrValBool(this.data.get('disabled'))) {
                    return;
                }
                const prefix = capture ? 'capture' : '';
                let touchRelation = this.touchRelation;
                touchRelation.move = {
                    x: $event.changedTouches[0].screenX,
                    y: $event.changedTouches[0].screenY
                };
                if (computeDistance(touchRelation.move, touchRelation.start) > TAP_DISTANCE_THRESHOLD) {
                    this.__computeDistanceWhenTap = true;
                }
                this.fire(prefix + 'bindtouchmove', $event);
                return originMethod.call(this, $event, capture);
            },

            created(originMethod = noop, ...args) {
                this.touchRelation = {};
                if ((hasCustomEvent(this.listeners) || this.shouldBindEvents) && !this.eventsBinded) {
                    this.nativeEvents = this.nativeEvents.concat(eventUtils(this.san).normalEvents);
                    this.eventsBinded = true;
                }
                return originMethod.call(this, ...args);
            },

            detached(originMethod = noop, ...args) {
                clearTimeout(this.__longpressTimer);
                clearTimeout(this.__capturelongpressTimer);
                return originMethod.call(this, ...args);
            }
        }
    },

    hoverEffect: {
        methods: {
            created(originMethod = noop, ...args) {
                const hoverClass = this.data.get('hoverClass');
                if (hoverClass && !this.eventsBinded) {
                    this.nativeEvents = this.nativeEvents.concat(eventUtils(this.san).normalEvents);
                    this.eventsBinded = true;
                }
                return originMethod.call(this, ...args);
            },

            onTouchStart(originMethod = noop, $event, capture) {
                if (!capture) {
                    this.hovering = true;
                    if (!$event.stopHoverClass && eventExecCondition.call(this, $event)) {
                        this.hoverStart($event);
                    }
                    if (attrValBool(this.data.get('hoverStopPropagation'))) {
                        $event.stopHoverClass = true;
                    }
                }
                return originMethod.call(this, $event, capture);
            },

            hoverCancel(originMethod = noop, $event, capture) {
                if (!capture) {
                    if (this.hovering) {
                        if (!$event.stopHoverClass) {
                            this.hoverStay($event);
                        }
                        if (attrValBool(this.data.get('hoverStopPropagation'))) {
                            $event.stopHoverClass = true;
                        }
                    }
                    this.hovering = false;
                }
            },

            onTouchMove(originMethod = noop, $event, capture) {
                if (HAS_DISABLED_TAG.indexOf(this.subTag) > -1 && attrValBool(this.data.get('disabled'))) {
                    return;
                }
                this.hoverCancel($event, capture);
                return originMethod.call(this, $event, capture);
            },

            onTouchEnd(originMethod = noop, $event, capture) {
                if (!eventExecCondition.call(this, $event)) {
                    return;
                }
                this.hoverCancel($event, capture);
                return originMethod.call(this, $event, capture);
            },

            onTouchcancel(originMethod = noop, $event, capture) {
                if (!eventExecCondition.call(this, $event)) {
                    return;
                }
                this.hoverCancel($event, capture);
                return originMethod.call(this, $event, capture);
            },

            hoverStay(originMethod = noop, $event) {
                const hoverClass = this.data.get('hoverClass');
                if (hoverClass) {
                    let hoverStayTime = this.data.get('hoverStayTime');
                    let privateClass = this.data.get('privateClass');
                    this.deleted = false;
                    clearTimeout(this.hoverStayId);
                    this.hoverStayId = setTimeout(() => {
                        this.data.set('privateClass', this.classDel(privateClass, hoverClass));
                        this.deleted = true;
                    }, hoverStayTime);
                }
            },

            hoverStart(originMethod = noop, $event) {
                const hoverClass = this.data.get('hoverClass');
                if (hoverClass) {
                    let hoverStartTime = this.data.get('hoverStartTime');
                    let privateClass = this.data.get('privateClass');
                    this.deleted = false;
                    this.hoverStartId = setTimeout(() => {
                        this.data.set('privateClass', this.classAdd(privateClass, hoverClass));
                        if (this.deleted) {
                            this.hoverStay($event);
                        }
                    }, hoverStartTime);
                }
            },

            classAdd(originMethod = noop, origin, fragmentName) {
                return (origin + ' ' + fragmentName).trim();
            },

            classDel(originMethod = noop, origin, fragmentName) {
                fragmentName = fragmentName.trim();
                return origin.replace(new RegExp(`${fragmentName}`, 'g'), '');
            }
        }
    },

    noNativeBehavior: {
        methods: {
            onContextmenu($event) {
                $event.preventDefault && $event.preventDefault();
            },

            compiled(originMethod = noop, ...args) {
                this.nativeEvents = this.nativeEvents.concat(eventUtils(this.san).nativeBehaviorEvents);
                return originMethod.call(this, ...args);
            }
        }
    },

    animateEffect: {
        methods: {
            created(originMethod = noop, ...args) {
                const animationEvents = [
                    'transitionend', 'webkitTransitionEnd',
                    'animationiteration', 'webkitAnimationIteration',
                    'animationstart', 'webkitAnimationStart',
                    'animationend', 'webkitAnimationEnd'];
                animationEvents.forEach(eventName => {
                    this.el.addEventListener(eventName, e => {
                        this.dispatchEvent(`bind${eventName}`);
                    });
                });
                return originMethod.call(this, ...args);
            },
            slaveRendered(originMethod = noop, ...args) {
                let animationData = this.data.get('animation');
                if (animationData && animationData.commandSetQueue
                    && !isEqualObject(this.__animationData, animationData)) {
                    this.__animationData = animationData;
                    animationData = null;
                    animationEffect(this.el, this.__animationData).then(() => {
                        this.communicator.fireMessage({
                            type: 'slaveUpdated'
                        });
                        this.communicator.fireMessage({
                            type: 'slaveRendered'
                        });
                    });
                }
                return originMethod.call(this, ...args);
            }
        }
    },
    nativeEventEffect: {
        methods: {
            created(originMethod = noop, ...args) {
                this.el.catchEvent = {
                    bubbling: {},
                    capture: {}
                };
                // 支持冒泡、捕获的事件
                this.bubEventNames = TOUCH_EVENTS_NAME;
                // 能终止tap事件冒泡、捕获的事件集合
                this.stopTapTags = ['bindtouchstart', 'capturebindtouchstart'];
                // 终止事件冒泡的NA组件集合
                this.stopBubblingTags = ['SWAN-CANVAS', 'SWAN-VIDEO', 'SWAN-LIVE-PLAYER',
                    'SWAN-CAMERA', 'SWAN-AR-CAMERA', 'SWAN-MAP', 'SWAN-BUTTON'];
                // 没有手势事件的NA组件集合即不支持冒泡、捕获的组件(如：map组件的bindtap属于自定义事件)
                this.noTouchEventTags = ['SWAN-MAP'];
                this.noTouchEventTags.indexOf(this.el.tagName) === -1 && this.bindNaEvents();
                return originMethod.call(this, ...args);
            },
            // 绑定手势事件监听
            bindNaEvents() {
                // NA组件未绑定touchstart事件，默认也监听，默认是冒泡阶段
                let eventList = Object.keys(this.listeners);
                this.el.tagName !== 'SWAN-VIEW'
                    && !this.listeners['bindtouchstart'] && !this.listeners['capturebindtouchstart']
                    && eventList.push('bindtouchstart');
                eventList.forEach(eventName => {
                    if (this.bubEventNames.indexOf(eventName.replace('capture', '')) > -1) {
                        this.bindNaBubblingEvent(eventName.replace('capture', '')); // 默认绑定冒泡事件
                        const capture = eventName.startsWith('capture');
                        capture && this.bindNaCaptureEvent(eventName.replace('capture', ''));
                        this.getEventCatch(eventName, capture);
                    }
                });
            },
            // 获取终止事件执行的参数catch
            getEventCatch(originMethod = noop, eventName, capture) {
                if (this.listeners[eventName]
                    && this.listeners[eventName][0].declaration.expr.args[4].value === 'catch') {
                    capture ? (this.el.catchEvent.capture[eventName] = true)
                        : (this.el.catchEvent.bubbling[eventName] = true);
                    if (this.stopTapTags.indexOf(eventName) > -1) {
                        this.el.catchEvent.bubbling['bindtap'] = true;
                        capture && (this.el.catchEvent.capture['capturebindtap'] = true);
                    }
                }
            },
            // 拼接返回给用户的参数
            getDispatchEvent(originMethod = noop, e) {
                e.detail.changedTouches.forEach(touch => {
                    touch.pageX = touch.clientX + window.scrollX;
                    touch.pageY = touch.clientY + window.scrollY;
                });
                e.detail.touches.forEach(touch => {
                    touch.pageX = touch.clientX + window.scrollX;
                    touch.pageY = touch.clientY + window.scrollY;
                });
                return {
                    target: e.target,
                    currentTarget: e.currentTarget,
                    touches: e.detail.touches,
                    changedTouches: e.detail.changedTouches,
                    timeStamp: e.detail.timeStamp
                };
            },
            // 绑定冒泡事件
            bindNaBubblingEvent(originMethod = noop, eventName) {
                this.el.addEventListener(eventName, e => {
                    // 冒泡到stopBubblingTags标签，终止冒泡
                    if (this.stopBubblingTags.indexOf(e.currentTarget.tagName) > -1
                        && e.currentTarget.tagName !== e.target.tagName) {
                        return e.stopPropagation();
                    }
                    // 点击到了目标元素&&触发了touchstart事件,表示可以触发tap事件
                    if (eventName === 'bindtouchstart' && e.target.id === e.currentTarget.id) {
                        this.el.triggerTap = true;
                    }
                    this.fire(eventName, this.getDispatchEvent(e));
                    // 遇到catch事件，终止冒泡
                    this.el.catchEvent.bubbling[eventName] && e.stopPropagation();
                });
            },
            // 绑定捕获事件
            bindNaCaptureEvent(originMethod = noop, eventName) {
                this.el.addEventListener(eventName, e => {
                    // 点击到了目标元素&&触发了touchstart事件,表示可以触发tap事件
                    if (eventName === 'bindtouchstart' && e.target.id === e.currentTarget.id) {
                        this.el.triggerTap = true;
                    }
                    this.fire(`capture${eventName}`, this.getDispatchEvent(e));
                    // 遇到catch事件，终止捕获
                    this.el.catchEvent.capture[`capture${eventName}`] && e.stopPropagation();
                }, true);
            },
            // 派发事件，先捕获再冒泡
            dispatchNaEvent(originMethod = noop, eventName, params = {}) {
                // 当前实例touchstart事件没触发则tap、longtap事件也不触发
                // 除去map组件，因为map组件的bindtap属于自定义事件
                if (!this.el || ((eventName === 'tap' || eventName === 'longtap')
                    && this.noTouchEventTags.indexOf(this.el.tagName) === -1
                    && (params.touches.length > 1 || !this.el.triggerTap))) {
                    return;
                }
                eventName === 'longtap' && this.dispatchNaEvent('longpress', params); // 长按事件支持longtap/longpress
                if (this.bubEventNames.indexOf(`bind${eventName}`) > -1
                    && this.noTouchEventTags.indexOf(this.el.tagName) === -1) {
                    this.el.dispatchEvent(new CustomEvent(`bind${eventName}`, {
                        detail: {
                            ...params
                        },
                        bubbles: true
                    }));
                } else { // 不需要冒泡的自定义事件
                    this.dispatchCustomEvent && this.dispatchCustomEvent(`bind${eventName}`, params);
                }
            }
        }
    },
    nativeCover: {
        methods: {
            attached(originMethod = noop, ...args) {
                this.__componentUpdatedHandler = message => {
                    const component = message.data.component;
                    // 不响应组件自身派发的 component:update
                    component !== this && this.slaveUpdated();
                };
                // 响应 component:update, 触发 update 操作
                this.communicator.onMessage('component:update', this.__componentUpdatedHandler);
                return originMethod.call(this, ...args);
            },

            detached(originMethod = noop, ...args) {
                this.communicator.delHandler('component:update', this.__componentUpdatedHandler);
                delete this.__componentUpdatedHandler;
                return originMethod.call(this, ...args);
            },

            /**
             * 创建 NA 视图
             * @param {Function} [originMethod] 原始方法
             * @param {string} [name] 端能力名称，可选值为 coverview/coverimage
             * @param {Object} [params] 端能力参数
             * @return {Promise} 端能力执行结果
             */
            insertNativeCover(originMethod = noop, {
                name = 'coverView',
                params = {}
            }) {
                return new Promise((resolve, reject) => {
                    this.boxjs.cover.insert({
                        name: `swan-${name}`,
                        data: params
                    }).then(res => {
                        resolve(res);
                    }).catch(err => {
                        console.warn('insertNativeCover::error:', err);
                        reject(err);
                    });
                });
            },

            /**
             * 更新 NA 视图
             * @param {Function} [originMethod] 原始方法
             * @param {string} [name] 端能力名称，可选值为 coverview/coverimage
             * @param {Object} [params] 端能力参数
             * @return {Promise} 端能力执行结果
             */
            updateNativeCover(originMethod = noop, {
                name = 'coverView',
                params = {}
            }) {
                return new Promise((resolve, reject) => {
                    this.boxjs.cover.update({
                        name: `swan-${name}`,
                        data: params
                    }).then(res => {
                        resolve(res);
                    }).catch(err => {
                        console.warn('updateNativeCover::error:', err);
                        reject(err);
                    });
                });
            },

            /**
             * 删除 NA 视图
             * @param {Function} [originMethod] 原始方法
             * @param {string} [name] 端能力名称，可选值为 coverview/coverimage
             * @param {Object} [params] 端能力参数
             * @return {Promise} 端能力执行结果
             */
            removeNativeCover(originMethod = noop, {
                name = 'coverView',
                params = {}
            }) {
                return new Promise((resolve, reject) => {
                    this.boxjs.cover.remove({
                        name: `swan-${name}`,
                        data: params
                    }).then(res => {
                        resolve(res);
                    }).catch(err => {
                        console.warn('removeNativeCover::error:', err);
                        reject(err);
                    });
                });
            },

            /**
             * 获得插入、更新 NA 视图所需的参数
             * @param {Function} [originMethod] 原始方法
             * @param {...Object} args 其它参数
             * @return {Object} 通用参数集合
             */
            getParams(originMethod = noop, ...args) {
                const hidden = this.data.get('hidden');
                return {
                    gesture: this.hasGestrue(),
                    slaveId: `${this.slaveId}`,
                    hide: `${attrValBool(hidden)}`,
                    // [TODO] viewId 应该使用用户传入的 id
                    viewId: `${this.id}`,
                    sanId: `${this.id}`,
                    parentId: this.getFirstParentComponentId(),
                    position: this.getElementBox(),
                    style: this.getStyle(),
                    ...originMethod.call(this, ...args)
                };
            },

            /**
             * 获得插入、更新 NA 视图所需的 style 参数
             * @param {Function} [originMethod] 原始方法
             * @param {HTMLElement} [element] html 节点
             * @return {Object} style 参数
             */
            getStyle(originMethod = noop, element = this.el) {
                if (!element) {
                    return {};
                }
                const {offsetWidth, offsetHeight} = element;
                const computedStyle = global.getComputedStyle(element);
                let {
                    opacity = 1,
                    paddingTop = 0,
                    paddingRight = 0,
                    paddingBottom = 0,
                    paddingLeft = 0,
                    borderTopWidth = 0,
                    borderRightWidth = 0,
                    borderBottomWidth = 0,
                    borderLeftWidth = 0,
                    borderRadius = 0,
                    borderColor = '#f0ffffff',
                    fontSize = 12,
                    fontWeight = 'normal',
                    textAlign,
                    textOverflow,
                    overflow,
                    wordBreak,
                    wordWrap,
                    backgroundColor,
                    color,
                    lineHeight
                } = computedStyle;

                borderRadius = parseFloat(borderRadius);
                fontSize = parseFloat(fontSize) || 12;
                lineHeight = parseFloat(lineHeight) || 1.2 * fontSize;

                let cssStyleWhiteSpace = computedStyle.whiteSpace;
                if (/%$/.test(computedStyle.borderRadius)) {
                    const borderRadiusPercentage = borderRadius / 100;
                    borderRadius = Math.min(
                        Math.min(offsetWidth / 2, offsetWidth * borderRadiusPercentage),
                        Math.min(offsetHeight / 2, offsetHeight * borderRadiusPercentage)
                    );
                } else if (this.swaninterface.boxjs.platform.isIOS()) {
                    borderRadius = Math.min(offsetWidth / 2, offsetHeight / 2, borderRadius);
                }

                if ('start' === textAlign) {
                    textAlign = 'left';
                } else if ('end' === textAlign) {
                    textAlign = 'right';
                } else if (!['left', 'center', 'right'].includes(textAlign)) {
                    textAlign = 'left';
                }

                if (isNaN(fontWeight)) {
                    switch (fontWeight) {
                        case 'bolder':
                            fontWeight = 'bold';
                            break;
                        default:
                            fontWeight = 'normal';
                    }
                } else if (fontWeight < 500) {
                    fontWeight = 'normal';
                } else if (fontWeight >= 500) {
                    fontWeight = 'bold';
                }
                let lineBreak = 'break-word';
                if ('visible' === overflow
                    || 'nowrap' !== cssStyleWhiteSpace
                    || 'ellipsis' !== textOverflow
                    && 'clip' !== textOverflow) {
                    if ('break-all' !== wordBreak && 'break-all' !== wordWrap) {
                        lineBreak = 'break-all';
                    }
                } else {
                    lineBreak = textOverflow;
                }
                let whiteSpace = 'nowrap';
                if ('nowrap' !== cssStyleWhiteSpace) {
                    whiteSpace = 'normal';
                }
                let fixed = computedStyle.position === 'fixed';
                if (attrValBool(this.data.get('fixed'))) {
                    fixed = true;
                }
                const overflowX = computedStyle.overflowX || 'visible';
                const overflowY = computedStyle.overflowY || 'visible';
                return {
                    bgColor: hexColor(backgroundColor),
                    borderRadius: `${borderRadius}`,
                    borderWidth: `${parseFloat(borderTopWidth)}`,
                    borderColor: hexColor(borderColor),
                    padding: [
                        `${parseFloat(paddingTop)}`,
                        `${parseFloat(paddingRight)}`,
                        `${parseFloat(paddingBottom)}`,
                        `${parseFloat(paddingLeft)}`
                    ],
                    border: [
                        `${parseFloat(borderTopWidth)}`,
                        `${parseFloat(borderRightWidth)}`,
                        `${parseFloat(borderBottomWidth)}`,
                        `${parseFloat(borderLeftWidth)}`
                    ],
                    opacity: `${parseFloat(opacity)}`,
                    color: hexColor(color),
                    fontSize: `${fontSize}`,
                    lineHeight, // ios 用此字段表line-height
                    lineSpace: `${Math.max(0, lineHeight - 1.2 * fontSize)}`, // android 用此字段模拟line-height
                    textAlign,
                    fontWeight,
                    lineBreak,
                    whiteSpace,
                    fixed,
                    overflowX,
                    overflowY
                };
            },

            /**
             * 获得插入、更新 NA 父视图所需的 style 参数
             * @param {Function} [originMethod] 原始方法
             * @param {HTMLElement} [element] html 节点
             * @return {Object} style 参数
             */
            getParentComponentStyle(originMethod = noop, element = this.el) {
                const parentComponent = this.parentComponent;
                const defualtRes = {
                    padding: [0, 0, 0, 0],
                    border: [0, 0, 0, 0]
                };
                if (!this || !element
                    || !parentComponent || !parentComponent.el
                    || !parentComponent.isNativeComponent) {
                    return defualtRes;
                }
                return parentComponent.isNativeComponent.call(parentComponent)
                    ? this.getStyle.call(parentComponent)
                    : defualtRes;
            },

            /**
             * 获得组件 transform 偏移量
             * @param {Function} [originMethod] 原始方法
             * @param {HTMLElement} [element] html 节点
             * @return {Object} 偏移量信息
             */
            getTranslate(originMethod = noop, element = this.el) {
                if (!element) {
                    return {x: 0, y: 0};
                }
                const computedStyle = global.getComputedStyle(element);
                return {
                    ...getCoordinatePairFromMatrixStr(computedStyle.transform || computedStyle.webkitTransform),
                    ...originMethod.call(this)
                };
            },

            /**
             * 获得组件相对于整个 webview 的位置、宽高
             * @param {Function} [originMethod] 原始方法
             * @param {HTMLElement} [element] html 节点
             * @return {Object} position 信息
             */
            getElementBox(originMethod = noop, element = this.el) {
                if (!element) {
                    return {};
                }
                const boundingClientRect = element.getBoundingClientRect();
                const hasNativeParentComponent = this.hasNativeParentComponent();
                const computedStyle = global.getComputedStyle(element);
                let fixed = computedStyle.position === 'fixed';
                if (attrValBool(this.data.get('fixed'))) {
                    fixed = true;
                }
                const borderWidth = [
                    parseFloat(computedStyle.getPropertyValue('border-top-width')),
                    parseFloat(computedStyle.getPropertyValue('border-right-width')),
                    parseFloat(computedStyle.getPropertyValue('border-bottom-width')),
                    parseFloat(computedStyle.getPropertyValue('border-left-width'))
                ];
                const {
                    padding = [0, 0, 0, 0],
                    border = [0, 0, 0, 0]
                } = this.getParentComponentStyle();
                const translate = this.getTranslate();
                const left = [
                    fixed
                        ? boundingClientRect.left
                        : (hasNativeParentComponent
                            ? element.offsetLeft
                            : (boundingClientRect.left + global.scrollX)),
                    borderWidth[3],
                    fixed ? 0 : translate.x,
                    fixed ? 0 : padding[3],
                    fixed ? 0 : border[3]
                ].reduce((a, b) => {
                    return parseFloat(a) + parseFloat(b);
                });
                const top = [
                    fixed
                        ? boundingClientRect.top
                        : (hasNativeParentComponent
                            ? element.offsetTop
                            : (boundingClientRect.top + global.scrollY)),
                    borderWidth[0],
                    fixed ? 0 : translate.y,
                    fixed ? 0 : padding[0],
                    fixed ? 0 : border[0]
                ].reduce((a, b) => {
                    return parseFloat(a) + parseFloat(b);
                });
                const width = element.offsetWidth - borderWidth[3] - borderWidth[1];
                const height = element.offsetHeight - borderWidth[0] - borderWidth[2];
                return {
                    left: `${left}`,
                    top: `${top}`,
                    width: `${width < 0 ? 0 : width}`,
                    height: `${height < 0 ? 0 : height}`
                };
            },

            updateOtherComponents(originMethod = noop, ...args) {
                // 通知其它组件需要进行 update 操作
                this.communicator.fireMessage({
                    type: 'component:update',
                    data: {
                        component: this
                    }
                });
                return originMethod.call(this, ...args);
            }
        }
    }
};
const decorateAction = (target, methodName, methods) => {
    const originMethod = target.prototype[methodName];
    target.prototype[methodName] = function (...args) {
        return methods[methodName].call(this, originMethod, ...args);
    };
};

export const behavior = (type, target) => {
    const types = typeof type === 'string' ? [type] : type;
    types.forEach(type => {
        const methods = (behaviorMap[type] || {}).methods;
        if (methods) {
            Object.keys(methods).forEach(methodName => decorateAction(target, methodName, methods));
        }
    });
    return target;
};
