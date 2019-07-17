/**
 * @file swan's file's base elements <movable-view>
 * @author jiamiao(jiamiao@baidu.com)
 */
import style from './index.css';
import {computeDistance, privateKey} from '../utils';
import {getElementBox} from '../utils/dom';
import computedMethod from './computedMethod';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {
    behaviors: ['userTouchEvents', 'noNativeBehavior', 'animateEffect'],

    template: `<swan-movable-view
        on-touchstart="onMovableViewTouchStart($event)"
        on-touchmove="onMovableViewTouchMove($event)"
        on-touchend="onMovableViewTouchEnd($event)"
        style="transform-origin: center center 0px;
            transform: translateX({{privateData.x}}px) translateY({{privateData.y}}px) translateZ(0) scale({{privateData.scaleValue}});
            will-change: {{privateData.changeStatus}}; transition-duration: {{privateData.transitionDuration}}s;">
        <slot></slot>
    </swan-movable-view>`,

    constructor(props) {
        this.moveStartPositionInView = ''; // 记录一次操作中手指在view中的坐标
        this.fingerTouchNum = 0; // 当前在movable-view的手指数量，用来判断位移或缩放
        this.isLastDoubleScale = false;
        this.orderScaleInitDistance = 0;
        this.lastFingerPosition = '';
        this.diffX = 0; // 缩放后在area左上角的x的坐标
        this.diffY = 0; // 缩放后在area左上角的y的坐标
        this.firstDirection = '';
        this.CACHE_INERTIA_UNIT = 100; // 调节惯性单位大小
        this.INERTIA_UNIT = 100; // 惯性单位
        this.viewActivateType = 1; // 本次操作的类型：1为拖动 2为缩放
    },

    initData() {
        return {
            x: 0,
            y: 0,
            scaleMin: 0.5,
            scaleMax: 10,
            scaleValue: 1,
            direction: 'none',
            scale: false,
            disabled: false,
            outOfBounds: false,
            damping: 20,
            friction: 2,
            inertia: false,
            [privateKey]: {
                transitionDuration: 0,
                changeStatus: 'auto',
                scaleValue: 1,
                x: 0,
                y: 0
            }
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'inertia', caster: typesCast.boolCast},
            {name: 'outOfBounds', caster: typesCast.boolCast},
            {name: 'disabled', caster: typesCast.boolCast},
            {name: 'scale', caster: typesCast.boolCast},
        ]),
        privateData() {
            return this.data.get(privateKey);
        }
    },

    attached() {
        this.areaPosition = getElementBox(this.el.parentElement);
        const {x, y, scaleValue} = this.data.get();
        let _x = this.coordinateCast(x, 'x', scaleValue);
        let _y = this.coordinateCast(y, 'y', scaleValue);
        this.data.set(`${privateKey}.x`, _x);
        this.data.set(`${privateKey}.y`, _y);
        this.data.set(`${privateKey}.scaleValue`, scaleValue);
        this.initCheckAttr();
        this.cacheScale = this.data.get(`${privateKey}.scaleValue`);
        this.receiveAreaMessageToScale();
        this.watchParams();

        this.communicator.onMessage('fullscreenchange', message => {
            let data = message && message.data;
            // 对于 ios 同层渲染，全屏时候需要禁用掉手势监听
            this.isVideoFullscreen = data
                && data.isVideoFullscreenChange
                && data.isFullscreen;
        });
    },

    /**
     * 是否可以移动视图
     *
     * @private
     * @return {boolean}
     */
    canMove() {
        return !this.isVideoFullscreen && !this.data.get('__disabled');
    },

    /**
     * 鼠标开始触碰事件，区分是位移还是缩放操作，记录其实位置坐标
     * @param {Object} [e] 鼠标event对象
     */
    onMovableViewTouchStart(e) {
        if (!this.canMove()) {
            return;
        }

        this.moving = false;
        this.stopMove();
        this.data.set(`${privateKey}.transitionDuration`, 0);
        // 修改目标为targetTouches
        this.fingerTouchNum = e.targetTouches.length;
        if (1 === this.fingerTouchNum) {
            this.cacheLastInfoforInitDistance(e);
            this.computedStartPositionInView(e);
        }
        else if (2 === this.fingerTouchNum) {
            this.cacheScale = this.data.get(`${privateKey}.scaleValue`);
            this.computedScaleInitDistance(e);
        }
        // android 下拉刷新冲突
        this.swaninterface.boxjs.platform.isAndroid() && this.boxjs.ui.open({
            name: 'swan-preventPullDownRefresh',
            data: {
                prevent: true,
                slaveId: `${this.slaveId}`
            }
        });

    },

    /**
     * 鼠标移动事件，区分是位移还是缩放，做相应变化
     * @param {Object} [e] 鼠标event对象
     */
    onMovableViewTouchMove(e) {
        // 无默认事件直接return
        if (!e.cancelable || !this.canMove()) {
            return;
        }

        // 系统下拉加载态时 捕获move中target的最上层的 DOM 元素
        let touchenterTarget = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        if (e.target !== touchenterTarget) {
            return;
        }
        this.data.set(`${privateKey}.changeStatus`, 'transform');
        if (1 === this.fingerTouchNum && !this.isLastDoubleScale) {
            this.translate(e);

            // 如果不是移动，不禁用默认事件
            if (this.moving) {
                this.preventEvents(e);
            }
        }
        else if (2 === this.fingerTouchNum) {
            this.preventEvents(e);
            this.scale(e);
        }
    },

    /**
     * 鼠标结束触碰事件，存储当前为多少手指操作，之后用来判断操作为单指或多指
     * @param {Object} [e] 鼠标event对象
     */
    onMovableViewTouchEnd(e) {
        if (!this.moving || !this.canMove()) {
            return;
        }

        this.preventEvents(e);

        this.data.set(`${privateKey}.changeStatus`, 'auto');
        this.triggerInertiaOrRebound(e);
        // 计算上一次是否为双指缩放，在缩放后放开一只手指和在ios上同时放开后还是走位移逻辑
        this.fingerTouchNum >= 2 && 1 === e.changedTouches.length ? this.isLastDoubleScale = true : this.isLastDoubleScale = false;
        // 手指离开时，将 x、y 属性重置
        this.data.set('x', NaN);
        this.data.set('y', NaN);
        this.swaninterface.boxjs.platform.isAndroid() && this.boxjs.ui.open({
            name: 'swan-preventPullDownRefresh',
            data: {
                prevent: false,
                slaveId: `${this.slaveId}`
            }
        });
    },

    ...computedMethod,

    /**
     * 初始化规范接收数据范围
     */
    initCheckAttr() {
        this.data.get('scaleMin') < 0.5 && (this.data.set('scaleMin', 0.5));
        this.data.get('scaleMin') > this.data.get('scaleMax') && (this.data.set('scaleMin', this.data.get('scaleMax')));
        this.data.get('scaleMax') < this.data.get('scaleMin') && (this.data.set('scaleMax', this.data.get('scaleMin')));
        this.data.get('scaleMax') > 10 && (this.data.set('scaleMax', 10));
        let {scaleMin, scaleMax} = this.data.get();
        const scaleValue = this.data.get(`${privateKey}.scaleValue`);
        scaleValue < scaleMin && (this.data.set(`${privateKey}.scaleValue`, scaleMin));
        scaleValue > scaleMax && (this.data.set(`${privateKey}.scaleValue`, scaleMax));
    },

    /**
     * 数据变动监听
     */
    watchParams() {
        this.watch(`${privateKey}.scaleValue`, val => {
            this.data.set(`${privateKey}.transitionDuration`, 0);
            this.triggerScaleEvent(val);
            // 宽或高超过area就不去限制缩放位移
            this.isViewBiggerThanArea(val) && this.limitRangeOfScaleZoom(privateKey);
            this.adjustViewInitPosition(val);
        });
        this.watch('friction', val => {
            this.changefriction(val);
        });
        // 下面监听了用户设置的scaleValue、x和y，监听改变校验通过后赋值给内部私有属性
        this.watch('scaleValue', val => {
            if (Number.isNaN(val)) {
                return;
            }
            this.limitRangeOfScaleZoom(privateKey);
            const {scaleMin, scaleMax} = this.data.get();
            val > scaleMin && scaleMin < scaleMax && (this.data.set(`${privateKey}.scaleValue`, val));
        });
        this.watch('x', val => {
            if (Number.isNaN(val)) {
                return;
            }
            const scaleValue = this.data.get(`${privateKey}.scaleValue`);
            let vaule = this.coordinateCast(val, 'x', scaleValue);
            this.data.set(`${privateKey}.x`, vaule);
        });
        this.watch('y', val => {
            if (Number.isNaN(val)) {
                return;
            }
            const scaleValue = this.data.get(`${privateKey}.scaleValue`);
            let vaule = this.coordinateCast(val, 'y', scaleValue);
            this.data.set(`${privateKey}.y`, vaule);
        });
    },

    coordinateCast(value, direction, scaleValue) {
        let axis = (direction === 'x' ? 'width' : 'height');
        let wraperLen = getElementBox(this.el)[axis];
        let diff = direction === 'x' ? this.diffX : this.diffY
        value - diff > this.areaPosition[axis] - wraperLen * scaleValue && (value = this.areaPosition[axis] - wraperLen * scaleValue + diff);
        value < diff && (value = diff);
        return value;
    },

    /**
     * 接收movable-area触发的改变movable-view缩放值的事件
     */
    receiveAreaMessageToScale() {
        this.communicator.onMessage('movableArea:changeScaleVal', ({type, data}) => {
            if (this.id === data.id) {
                0 === data.status && (this.cacheScale = this.data.get(`${privateKey}.scaleValue`));
                1 === data.status && data.scale && this.changeScaleValue(data.scale);
            }
        });
    },

    /**
     * scaleValue改变，触发用户绑定的scale事件
     * @param {number} [scaleValue] 当前缩放倍数
     */
    triggerScaleEvent(scaleValue) {
        const {x, y} = this.data.get(privateKey);
        this.dispatchEvent('bindscale', {
            detail: {
                x,
                y,
                scale: scaleValue
            }
        });
    },

    /**
     * 缩放后，view在area的左上角坐标改变
     * @param {number} [scaleValue] 当前缩放倍数
     */
    adjustViewInitPosition(scaleValue) {
        const {width, height} = getElementBox(this.el);
        this.diffX = width * (scaleValue - 1) / 2;
        this.diffY = height * (scaleValue - 1) / 2;
    },

    /**
     * scaleValue变化之后，判断view的宽或高是否比area大
     * @param {number} [scaleValue] 当前缩放倍数
     * @return {boolean} 标识当前view的宽或高是否比area大
     */
    isViewBiggerThanArea(scaleValue) {
        const {width, height} = getElementBox(this.el);
        return scaleValue * width <= this.areaPosition.width || scaleValue * height <= this.areaPosition.height;
    },

    /**
     * friction改变时，需要重新计算惯性单位，越大则越快停止
     * @param {number} [friction] 当前的摩擦系数值
     */
    changefriction(friction) {
        const parseFriction = Math.sqrt(+friction);
        friction > 0 && (this.INERTIA_UNIT = this.CACHE_INERTIA_UNIT / parseFriction);
    },

    /**
     * 阻止事件冒泡
     * @param {Object} [e] 鼠标event对象
     */
    preventEvents(e) {
        e.stopPropagation();
        e.cancelable && e.preventDefault();
    },

    /**
     * 缓存上一次touchstart的x、y值，便于缩放时计算初始距离
     * @param {Object} [event] 鼠标event对象
     */
    cacheLastInfoforInitDistance(event) {
        const {pageX, pageY} = event.changedTouches[0];
        this.lastFingerPosition = {x: pageX, y: pageY, firstDirection: '', startMoveTime: event.timeStamp};
    },

    /**
     * 计算touchstart时手指在movable-view中的坐标，位移时减掉长度
     * @param {Object} [event] 鼠标event对象
     */
    computedStartPositionInView(event) {
        const {pageX, pageY} = event.changedTouches[0];
        this.areaPosition = getElementBox(this.el.parentElement);
        const {top, left} = this.areaPosition;
        const {x, y} = this.data.get(privateKey);
        this.moveStartPositionInView = {x: pageX - left - x, y: pageY - top - y, pageX, pageY};
    },

    /**
     * 计算两指触碰movable-view时，两指的初始位置，便于结束缩放时拿前后两指的距离算出scaleValue
     * @param {Object} [event] 鼠标event对象
     */
    computedScaleInitDistance(event) {
        const {pageX, pageY} = event.changedTouches[0];
        if (event.changedTouches.length > 1) {
            this.orderScaleInitDistance = computeDistance({x: pageX, y: pageY},
                {x: event.changedTouches[1].pageX, y: event.changedTouches[1].pageY});
        }
        else {
            this.orderScaleInitDistance = computeDistance({x: this.lastFingerPosition.x, y: this.lastFingerPosition.y},
                {x: pageX, y: pageY});
        }
    },

    /**
     * 根据位移后是否超出边界来判断走惯性还是回弹的逻辑
     * @param {Object} [e] 鼠标event对象
     */
    triggerInertiaOrRebound(e) {
        if (1 === this.viewActivateType) {
            const {pageX, pageY} = e.changedTouches[0];
            const {top, left} = this.areaPosition;
            const {x, y} = this.moveStartPositionInView;
            const limitPos = this.limitRangeOfMovement(pageX - left - x, pageY - top - y, privateKey, 2);
            // 判断前后x和y有无改变，若改变了就代表超出了边界
            if (limitPos.x === pageX - left - x && limitPos.y === pageY - top - y) {
                this.inertiaAction(e);
            }
            else {
                this.data.set(`${privateKey}.transitionDuration`, 12 / this.data.get('damping'));
                this.changeXYToMove(limitPos, this.data.get('direction'));
            }
        }
    },

    /**
     * 触发用户绑定的chage事件
     * @param {string} [source] 当前change事件的类型
     */
    triggerChangeEvent(source) {
        const {x, y} = this.data.get(privateKey);
        this.dispatchEvent('bindchange', {
            detail: {
                x,
                y,
                source
            }
        });
    },

    /**
     * 触发用户绑定的htouchmove事件
     * @param {Object} [e] 鼠标event对象
     */
    triggerhtouchmoveEvent(e) {
        if (this.lastFingerPosition.firstDirection === 'horizon') {
            this.fire('bindhtouchmove', e);
        }
    },

    /**
     * 触发用户绑定的vtouchmove事件
     * @param {Object} [e] 鼠标event对象
     */
    triggervtouchmoveEvent(e) {
        if (this.lastFingerPosition.firstDirection === 'vertical') {
            this.fire('bindvtouchmove', e);
        }
    },

    /**
     * 位移相关操作
     * @param {Object} [e] 鼠标event对象
     */
    translate(e) {
        const {pageX, pageY} = e.changedTouches[0];
        const {top, left} = this.areaPosition;
        const {x, y, pageX: startPageX, pageY: startPageY} = this.moveStartPositionInView;
        // 如果偏移量超过指定阈值，则认为是在移动操作，用于区分可能用户在点击移动区域某些交互元素
        if (Math.abs(startPageX - pageX) > 2 || Math.abs(startPageY - pageY) > 2) {
            this.moving = true;
        }

        this.viewActivateType = 1;
        const direction = this.data.get('direction');
        if (direction !== 'none') {
            let limitPos = this.limitRangeOfMovement(pageX - left - x, pageY - top - y, privateKey);
            this.changeXYToMove(limitPos, direction);
            this.triggerChangeEvent('touch');
            if (!this.lastFingerPosition.firstDirection) {
                const isHorizon = Math.abs(pageX - this.lastFingerPosition.x)
                    > Math.abs(pageY - this.lastFingerPosition.y);
                this.lastFingerPosition.firstDirection = isHorizon ? 'horizon' : 'vertical';
            }
            this.triggerhtouchmoveEvent(e);
            this.triggervtouchmoveEvent(e);
        }
    },

    /**
     * 双指缩放的操作
     * @param {Object} [e] 鼠标event对象
     */
    scale(e) {
        if (e.targetTouches.length < 2) {
            return;
        }
        this.viewActivateType = 2;
        let currentDistance = computeDistance({x: e.targetTouches[0].pageX, y: e.targetTouches[0].pageY},
            {x: e.targetTouches[1].pageX, y: e.targetTouches[1].pageY});
        this.changeScaleValue(Math.sqrt(currentDistance / this.orderScaleInitDistance));
    },

    /**
     * 当view在因为惯性移动时，touchstart后停止移动
     */
    stopMove() {
        const style = global.getComputedStyle(this.el).getPropertyValue('transform');
        if (style !== 'none') {
            let data = style.match(/\((.+?)\)/g)[0].slice(1, -1).split(',');
            this.changeXYToMove({x: +data[4], y: +data[5]}, this.data.get('direction'));
        }
    },

    /**
     * 最终管理缩放倍数的方法
     * @param {Number} [scale] 要改变的缩放倍数值
     */
    changeScaleValue(scale) {
        const {width, height} = getElementBox(this.el);
        const isScale = this.data.get('__scale');
        const {scaleMin, scaleMax} = this.data.get();
        // 若view的宽或高比area大或缩放倍数小于最小值或大于最大值则不能缩放
        if (this.areaPosition.width - width > 0 && this.areaPosition.height - height > 0 && isScale && this.cacheScale * scale > scaleMin && this.cacheScale * scale < scaleMax) {
            this.data.set(`${privateKey}.scaleValue`, this.cacheScale * scale);
        }
    },

    /**
     * 最终管理改变x、y坐标的方法
     * @param {Object} [obj] key为x、y的对象，标识要位移坐标的x、y值
     * @param {string} [direction] moveabel-view支持操作的方向
     */
    changeXYToMove({x, y}, direction) {
        if ('all' === direction) {
            this.data.set(`${privateKey}.x`, x);
            this.data.set(`${privateKey}.y`, y);
        }
        else if ('vertical' === direction) {
            this.data.set(`${privateKey}.y`, y);
        }
        else if ('horizontal' === direction) {
            this.data.set(`${privateKey}.x`, x);
        }
    },

    /**
     * 计算结束位移操作瞬间的速度
     * @param {Object} [e] 鼠标event对象
     * @return {Object} x和y轴结束位移时的瞬间速度
     */
    inertiaSpeed(e) {
        const {pageX, pageY} = e.changedTouches[0];
        const currentTime = e.timeStamp || Date.now();
        const {x, y, startMoveTime} = this.lastFingerPosition;
        const timeDiff = currentTime - startMoveTime;
        return {
            x: (pageX - x) / timeDiff,
            y: (pageY - y) / timeDiff
        };
    },

    /**
     * 若开启了惯性，结束位移后再位移一段距离
     * @param {Object} [e] 鼠标event对象
     */
    inertiaAction(e) {
        if (this.data.get('__inertia')) {
            const {pageX, pageY} = e.changedTouches[0];
            const {top, left} = this.areaPosition;
            const {x, y} = this.moveStartPositionInView;
            let inertiaSpeed = this.inertiaSpeed(e);
            let inertiaDuration = Math.abs((Math.max(inertiaSpeed.x, inertiaSpeed.y)));
            inertiaDuration = inertiaDuration < 0.3 ? inertiaDuration : 0.3;
            this.data.set(`${privateKey}.transitionDuration`, inertiaDuration);
            const limitPos = this.limitRangeOfMovement(pageX - left - x + this.INERTIA_UNIT * inertiaSpeed.x, pageY - top - y + this.INERTIA_UNIT * inertiaSpeed.y, privateKey, 2);
            this.changeXYToMove(limitPos, this.data.get('direction'));
            setTimeout(() => {
                this.data.set(`${privateKey}.transitionDuration`, 0);
            }, inertiaDuration * 1000);
        }
    }
};
