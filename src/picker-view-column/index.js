/**
 * @file bdml's file's picker-view-column elements <picker-view-column>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import style from './index.css';
import {getCoordinatePairFromMatrixStr} from '../utils';

export default {
    behaviors: ['userTouchEvents', 'noNativeBehavior'],
    constructor() {
        this.startPageY = 0; // 点击起始位置纵坐标
        this.curTranslateY = 0; // 当前位置
        this.duration = 400; // 滑动选择动画执行时间(ms)
        this.tapDuration = 200; // 点击选择动画执行事件(ms)
        this.inertiaTime = 0.2; // 惯性距离执行时间(s)
        this.maxTranslateY = 0; // 最大的滑动距离
        this.oldValue = []; // 页面初始化value
        this.total = 0; // 总个数
        this.columnIndex = 0; // 当前column的索引
        this.isMove = false; // 是否处于滑动状态
        this.lastTouch = {}; // 最后一次移动事件
        this.secondLastTouch = {}; // 倒数第二次移动事件
    },
    template: `
        <swan-picker-view-column
            on-touchstart="onTouchStart($event)"
            on-touchmove="onTouchMove($event)"
            on-touchend="onTouchEnd($event)">
            <div class="swan-picker__group" s-ref="columnGroup">
                <div class="swan-picker__mask" s-ref="columnMask"></div>
                <div class="swan-picker__indicator" s-ref="columnIndicator"></div>
                <div class="swan-picker__content" s-ref="columnContent"
                    style="transform: translate3d(0px, 0px, 0px)">
                    <slot></slot>
                </div>
            </div>
        </swan-picker-view-column>`,

    attached() {
        this.el.curIndex = 0;
        this.contentRef = this.ref('columnContent');
        this.columnIndex = this.el.parentNode.children.length - 1;
        this.initViewColumnStyle();
        this.indicatorHeight = this.getComputeHeight(this.ref('columnIndicator'));
        this.bindTransitionEnd();
        this.communicator.onMessage(
            `pickerView_${this.el.parentNode.dataset.sanid}`,
            message => {
                this.pickerViewDataChangeHandler();
            }
        );
    },

    detached() {
        this.communicator.delHandler(`pickerView_${this.el.parentNode.dataset.sanid}`);
    },

    pickerViewDataChangeHandler() {
        this.total = this.contentRef.children.length;
        if (this.oldTotal !== this.total) {
            this.oldTotal = this.total;
            this.initItemStyle(this.indicatorHeight);
            this.maxTranslateY = (this.total - 1) * this.indicatorHeight;
        }
        const newValue = this.scope.raw.value;
        if (newValue && newValue.length
            && this.oldValue[this.columnIndex] !== newValue[this.columnIndex]) { // 监控value变化
            this.oldValue = newValue;
            this.initViewColumnValue();
        }
    },

    /**
     *
     * 获取行内高度
     *
     * @param {Object} [obj] dom对象
     * @return {number} 高度
     */
    getComputeHeight(obj) {
        return parseInt(getComputedStyle(obj).height, 10) || 0;
    },

    /**
     * 初始化每列样式
     */
    initViewColumnStyle() {
        const {indicatorStyle, indicatorClass, maskStyle, maskClass} = this.scope.raw;
        const pickerHeight = this.getComputeHeight(this.el.parentNode.parentNode);
        const indicatorRef = this.ref('columnIndicator');
        let indicatorHeight = this.getComputeHeight(indicatorRef);
        this.ref('columnGroup').style.height = pickerHeight + 'px';
        indicatorRef.style.cssText = indicatorStyle;
        const halfHeight = (pickerHeight - indicatorHeight) / 2 + 'px';
        Object.assign(this.ref('columnMask').style, {
            cssText: maskStyle,
            backgroundSize: '100% ' + halfHeight
        });
        this.ref('columnMask').setAttribute('class', `swan-picker__mask ${maskClass}`);
        indicatorRef.style.top = halfHeight;
        indicatorRef.setAttribute('class', `swan-picker__indicator ${indicatorClass}`);
        this.contentRef.style.padding = halfHeight + ' 0px';
    },

    /**
     * 初始化每个选项的样式
     * @param {number} [indicatorHeight] 选项高度
     */
    initItemStyle(indicatorHeight) {
        Array.prototype.slice.call(this.contentRef.children).forEach((child, index) => {
            child.style.height = indicatorHeight + 'px';
            child.style.overflow = 'hidden';
            child.setAttribute('index', index);
        });
    },

    /**
     * 初始化页面选项值
     */
    initViewColumnValue() {
        let index = this.scope.raw.value[this.columnIndex] || 0;
        index > (this.total - 1) && (index = this.total - 1);
        index < 0 && (index = 0);
        this.setSelectedPosition(index);
        this.setTransfrom(0, 0);
    },

    /**
     * 设置选中值的索引和位置
     * @param {Object} [index] 选中项索引
     */
    setSelectedPosition(index) {
        this.curTranslateY = -index * this.indicatorHeight;
        this.el.curIndex = index;
    },

    /**
     * 滑动选项绑定动画结束事件
     */
    bindTransitionEnd() {
        this.contentRef.addEventListener('transitionend', event => {
            this.resetTranslateY();
        });
        this.contentRef.addEventListener('webkitTransitionEnd', event => {
            this.resetTranslateY();
        });
    },

    /**
     * 超出最大、最小滑动距离则重置位置
     * 未超出边界值则正常滑动结束触发bindchange事件
     * @return {boolean} 终止运行
     */
    resetTranslateY() {
        if (Math.abs(this.curTranslateY) > Math.abs(this.maxTranslateY)) {
            this.curTranslateY = -this.maxTranslateY;
            return this.setTransfrom();
        }
        if (this.curTranslateY > 0) {
            this.curTranslateY = 0;
            return this.setTransfrom();
        }
        this.isMove = false;
        this.el.curIndex = Math.abs(this.curTranslateY / this.indicatorHeight);
        this.dispatch('UI:picker-view-column-change');
    },

    /**
     * 设置选项位置
     * @param {number} [diffY] 滑动距离
     * @param {number} [duration] 动画时间
     */
    setTransfrom(diffY = 0, duration = this.duration) {
        duration && (this.isMove = true);
        const style = `translate3d(0px, ${diffY + this.curTranslateY}px, 0px)`;
        Object.assign(this.contentRef.style, {
            webkitTransitionDuration: duration + 'ms',
            transitionDuration: duration + 'ms',
            webkitTransform: style,
            transform: style
        });
    },

    /**
     * 清空手势记录
     */
    clearTouchRecord() {
        this.lastTouch = {};
        this.secondLastTouch = {};
    },

    /**
     * 记录touch，用于计算滑动速度
     * @param {Object} event 事件对象
     */
    touchRecord(event) {
        Object.assign(this.secondLastTouch, this.lastTouch);
        Object.assign(this.lastTouch, {
            y: event.changedTouches[0].pageY,
            time: event.timeStamp
        });
    },

    /**
     * 计算滑动速度
     * @return {number} 滑动速度
     */
    getTouchSpeed() {
        const timeDiff = this.lastTouch.time - this.secondLastTouch.time;
        const distance = this.lastTouch.y - this.secondLastTouch.y;
        return distance / timeDiff * 1000;
    },

    /**
     * 触发点击事件
     * @param {Object} event 事件对象
     */
    triggerTap(event) {
        const itemIndex = parseInt(event.target.getAttribute('index'), 10);
        if (itemIndex !== this.el.curIndex) {
            this.setSelectedPosition(itemIndex);
            this.setTransfrom(0, this.tapDuration);
        }
    },

    /**
     * 点击停止滑动
     * @param {Object} event 事件对象
     */
    stopColumnSliding() {
        const transform = getComputedStyle(this.contentRef).transform;
        this.curTranslateY = getCoordinatePairFromMatrixStr(transform).y;
        this.setTransfrom(0, 0);
    },

    onTouchStart(event) {
        event.stopPropagation();
        event.preventDefault();
        const touch = event.changedTouches[0];
        this.stopColumnSliding();
        this.startPageY = touch.pageY;
        this.isMove = false;
        Object.assign(this.lastTouch, {
            y: touch.pageY,
            time: event.timeStamp
        });
    },

    onTouchMove(event) {
        event.stopPropagation();
        event.preventDefault();
        this.isMove = true;
        const touch = event.changedTouches[0];
        let diffY = touch.pageY - this.startPageY;
        if ((diffY > 0 && this.curTranslateY >= 0)
            || (diffY < 0 && Math.abs(this.curTranslateY) >= Math.abs(this.maxTranslateY))) {
            diffY = diffY / 3;
        }
        this.setTransfrom(diffY, 0);
        this.touchRecord(event);
    },

    onTouchEnd(event) {
        event.stopPropagation();
        event.preventDefault();
        if (!this.isMove) { // 未滑动，触发点击事件
            return this.triggerTap(event);
        }
        const touch = event.changedTouches[0];
        const diffY = touch.pageY - this.startPageY;
        // 滑到底或到顶，此时需要回弹到原位置
        if ((diffY > 0 && this.curTranslateY === 0)
            || (diffY < 0 && Math.abs(this.curTranslateY) === Math.abs(this.maxTranslateY))) {
            return this.setTransfrom();
        }
        const speedY = this.getTouchSpeed();
        this.curTranslateY = parseInt(this.curTranslateY + diffY + speedY * this.inertiaTime, 10);
        this.curTranslateY = Math.round(this.curTranslateY / this.indicatorHeight, 2) * this.indicatorHeight;
        this.setTransfrom();
        this.clearTouchRecord();
    }
};
