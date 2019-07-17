/**
 * @file bdml's file's swiper elements <swiper>
 * @author liuyuekeng(liuyuekeng@baidu.com)
 */
import style from './index.css';
import {internalDataComputedCreator, typesCast} from '../computedCreator';
import {isNaN, rpx2Vm} from '../utils';

function marginCaster(attr) {
    return function () {
        let raw = typesCast.stringCast(attr).call(this);
        return rpx2Vm(raw);
    };
}

export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior'],

    template: `<swan-swiper class="swan-swiper-wrapper">
            <div class="swan-swiper-slides" style="{{getStyle}}">
                <div s-ref="swiperSlides" class="swan-swiper-slide-frame"
                    on-touchend="onSwiperTouchEnd($event)"
                    on-touchcancel="onSwiperTouchEnd($event)"
                    on-touchstart="onSwiperTouchStart($event)"
                    on-touchmove="onSwiperTouchMove($event)">
                    <slot></slot>
                </div>
            </div>
            <div s-if="__indicatorDots"
                class="swan-swiper-dots {{__vertical ? 'swan-swiper-dots-vertical' : 'swan-swiper-dots-horizontal'}}">
                <div s-for="v, k in swiperDots" class="swan-swiper-dot"
                style="background: {{ v ? indicatorActiveColor : indicatorColor}}"></div>
            </div>
        </swan-swiper>`,

    constructor(props) {
        // 一共有total个子元素，在数据更新(slaveRendered)时更新
        this.total = 0;
        // 总元素个数减去一屏显示的个数，还剩下的元素个数
        this.remainingCount = 0;
        // slider的偏移量，单位px，负值表示左/上，正值表示右/下
        this.offset = 0;
        // slider的DOM节点
        this.swiperSlides = null;
        // 衔接滑动缓冲元素个数，负值表示左/上，正值表示右/下
        this.bufferCount = 0;
        // slider的宽，单位px
        this.containerWidth = 0;
        // slider的高，单位px
        this.containerHeight = 0;
        // 单个slider item的宽/高
        this.unitDistance = 0;
        // 单个slider item的宽/高，单位%
        this.unitDistancePercent = 0;
        // 手指拖动期间的轴方向(x/y)，不在拖动过程中为'',根据过程中首个touchmove事件确定
        this.direction = '';
        // 记录关键滑动
        this.lastTouch = null;
        this.second2LastTouch = null;
        this.startTouch = null;
        // 动画执行计时器
        this.animationTimer = null;
        // 自动轮播计时器
        this.autoplayTimer = null;
        // 当前索引
        this.index = 0;
        // 点击开始时的索引
        this.touchStartIndex = null;
        // 是否轮播，内部状态
        this.circular = false;
    },

    initData() {
        return {
            // 是否纵向滑动
            'vertical': false,
            // 当前所在滑块的索引，NaN用于区别用户传的值，获取current时需要重新处理默认值逻辑
            'current': NaN,
            // 当前所在滑块ID，优先级低于current
            'currentItemId': '',
            // 是否采用衔接滑动
            'circular': false,
            // 是否自动切换
            'autoplay': false,
            // 自动轮播间隔, 单位ms
            'interval': 5000,
            // 是否显示面板指示点
            'indicatorDots': false,
            // 指示点颜色
            'indicatorColor': 'rgba(0, 0, 0, .3)',
            // 当前选中的指示点颜色
            'indicatorActiveColor': '#000000',
            // 动画执行时间，单位ms
            'duration': 500,
            // 指示点数组，1代表active，反之为0
            'swiperDots': [],
            // 同时显示的滑块数量
            'displayMultipleItems': 1,
            // 前边距，支持px和rpx
            'previousMargin': '0px',
            // 后边距，支持px和rpx
            'nextMargin': '0px'
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'vertical', caster: typesCast.boolCast},
            {name: 'circular', caster: typesCast.boolCast},
            {name: 'indicatorDots', caster: typesCast.boolCast},
            {name: 'autoplay', caster: typesCast.boolCast},
            {name: 'previousMargin', caster: marginCaster},
            {name: 'nextMargin', caster: marginCaster}
        ]),
        getStyle() {
            let previousMargin = this.data.get('__previousMargin');
            let nextMargin = this.data.get('__nextMargin');
            let style = this.data.get('__vertical')
                ? `top: ${previousMargin}; bottom: ${nextMargin}`
                : `left: ${previousMargin}; right: ${nextMargin}`;
            return style;
        }
    },

    /**
     * 组件渲染完成钩子
     */
    attached() {
        this.swiperSlides = this.ref('swiperSlides');
        this.circular = this.data.get('__circular')
            && this.swiperSlides.children.length > +this.data.get('displayMultipleItems');
        this.watchParams();

        this.communicator.onMessage('fullscreenchange', message => {
            let data = message && message.data;
            // 对于 ios 同层渲染，全屏时候需要禁用掉手势监听
            this.isVideoFullscreen = data
                && data.isVideoFullscreenChange
                && data.isFullscreen;
        });
    },

    detached() {
        this.autoplayTimer && clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
        this.animationTimer && clearTimeout(this.animationTimer);
        this.animationTimer = null;
    },

    /**
     * 数据更新钩子
     */
    slaveRendered() {
        // 数据更新后要在nextTick视图才更新
        this.nextTick(() => {
            this.swiperSlides = this.ref('swiperSlides');
            let {displayMultipleItems, __vertical} = this.data.get();
            displayMultipleItems = parseInt(displayMultipleItems, 10);
            this.containerWidth = this.swiperSlides.clientWidth;
            this.containerHeight = this.swiperSlides.clientHeight;
            this.unitDistance = (__vertical ? this.containerHeight : this.containerWidth) / (displayMultipleItems);
            this.unitDistancePercent = 100 / (displayMultipleItems);
            const total = this.swiperSlides.children.length;
            if (this.total !== total || this.oriUnitDistance !== this.unitDistance) {
                this.circular = this.data.get('__circular')
                    && total > +this.data.get('displayMultipleItems');
                this.total = total;
                this.oriUnitDistance = this.unitDistance;
                this.resetSlider();
            }
        });
    },

    /**
     * 数据变动监听
     */
    watchParams() {
        this.watch('current', value => {
            if (isNaN(value)) {
                return;
            }
            this.current2Index();
            this.goToIndex();
        });
        this.watch('currentItemId', value => {
            let itemExist = this.currentId2Index();
            if (itemExist) {
                this.goToIndex();
            }
        });
        this.watch('autoplay', value => {
            this.data.get('__autoplay') ? this.autoPlayOn() : this.autoPlayOff();
        });
        this.watch('interval', value => {
            if (this.data.get('__autoplay')) {
                this.autoPlayOff();
                this.autoPlayOn();
            }
        });
    },

    /**
     * 重置slider
     */
    resetSlider() {
        const displayMultipleItems = +this.data.get('displayMultipleItems');
        this.offsetLimitL = (0.5 - this.total) * this.unitDistance;
        this.offsetLimitR = 0.5 * this.unitDistance;
        this.remainingCount = this.total - displayMultipleItems;
        let oldIndex = this.index;
        this.current2Index();
        this.currentId2Index();
        if (this.data.get('current') !== this.data.get('current')
            && !this.data.get('currentItemId')
            && oldIndex !== this.index) {
            this.current2Index(oldIndex);
        }
        this.initSliderPosition();
        this.initSlidItemsPosition();
        this.initSwiperDots();
        this.bufferReset();
        if (this.data.get('__autoplay')) {
            this.autoPlayOn();
        }
    },

    /**
     * 初始化slider的位置
     */
    initSliderPosition() {
        this.transformSlider(-this.index * this.unitDistance);
        this.setSliderDuration(0);
    },

    /**
     * 初始化slider item的位置
     */
    initSlidItemsPosition() {
        let items = this.swiperSlides && this.swiperSlides.children;
        if (!items || !items.length) {
            return;
        }
        let len = items.length;
        for (let i = 0; i < len; i ++) {
            let offsetPercent = 100 * i;
            let style = this.data.get('__vertical')
                ? `translate(0px, ${offsetPercent}%)`
                : `translate(${offsetPercent}%, 0px)`;
            items[i].style.transform = style;
            items[i].style.webkitTransform = style;
            items[i].style[this.data.get('__vertical') ? 'height' : 'width'] = this.unitDistancePercent + '%';
            items[i].style.position = 'absolute';
        }
    },

    /**
     * 初始化指示点
     */
    initSwiperDots() {
        let total = this.total;
        let swiperDots = [];
        while (total--) {
            swiperDots.push(0);
        }
        this.data.set('swiperDots', swiperDots);
        this.setActiveSwiperDots();
    },

    /**
     * 鼠标点击事件，记录起始点击位置
     * @param {Object} [event] 鼠标event对象
     */
    onSwiperTouchStart(event) {
        if (this.isVideoFullscreen || event.touches.length >= 2) {
            return;
        }
        this.stopAnimation();
        this.touchRecord(event);
        this.autoPlayOff();
        this.touchStartIndex = this.index;
    },

    /**
     * 鼠标移动事件
     * @param {Object} [event] 鼠标event对象
     */
    onSwiperTouchMove(event) {
        if (this.isVideoFullscreen || event.touches.length >= 2) {
            return false;
        }
        const touch = event.changedTouches[0];
        let diffX = touch.pageX - this.lastTouch.x;
        let diffY = touch.pageY - this.lastTouch.y;
        this.touchRecord(event);
        const vertical = this.data.get('__vertical');
        if (!this.direction) {
            this.direction = Math.abs(diffX) >= Math.abs(diffY) ? 'x' : 'y';
            if (!vertical
                && this.direction === 'x'
                && this.swaninterface.boxjs.platform.isAndroid()) {
                // 阻止 android 端下拉刷新
                this.boxjs.ui.open({
                    name: 'swan-preventPullDownRefresh',
                    data: {
                        prevent: true,
                        slaveId: `${this.slaveId}`
                    }
                });
            }
        }
        if ((!vertical && this.direction === 'x') || (vertical && this.direction === 'y')) {
            // patch Intervention js内部报错
            if (event.cancelable) {
                event.preventDefault();
            }
            event.stopPropagation();
        } else {
            return false;
        }
        let offset = this.offset + (vertical ? diffY : diffX);
        this.transformSlider(offset);
        this.slicerRangeLimit();
        this.bufferReset();
    },

    /**
     * 鼠标抬起事件
     * @param {Object} [event] 鼠标event对象
     */
    onSwiperTouchEnd(event) {
        if (this.isVideoFullscreen || event.touches.length >= 2) {
            return false;
        }
        // 开启 android 端下拉刷新
        this.swaninterface.boxjs.platform.isAndroid() && this.boxjs.ui.open({
            name: 'swan-preventPullDownRefresh',
            data: {
                prevent: false,
                slaveId: `${this.slaveId}`
            }
        });
        const direction = this.direction;
        this.direction = '';
        this.snap();
        this.autoPlayOn();
        const vertical = this.data.get('__vertical');
        if ((vertical && direction === 'x') || (!vertical && direction === 'y')) {
            return;
        }
        this.updateIndexByOffset();
        this.setActiveSwiperDots();
        if (this.touchStartIndex !== null
            && this.touchStartIndex !== this.index) {
            this.triggerChange('touch');
        }
        this.touchStartIndex = null;
    },

    /**
     * 设置指示点的active状态
     * @return {boolean} 设置是否成功
     */
    setActiveSwiperDots() {
        let start = this.index;
        let number = this.data.get('displayMultipleItems');
        if (start > this.total - 1) {
            return false;
        }
        let swiperDots = this.data.get('swiperDots');
        let newSwiperDots = [];
        swiperDots.forEach((v, k) => {
            newSwiperDots[k] = 0;
        });
        for (let i = 0; i < number; i ++) {
            let index = start + i;
            if (index < this.total) {
                newSwiperDots[index] = 1;
            } else if (this.circular) {
                newSwiperDots[index - this.total] = 1;
            }
        }
        this.data.set('swiperDots', newSwiperDots);
        return true;
    },

    /**
     * 通过current获取合法的current index
     * @param {number} specifiedValue 指定的值，不从current获取
     */
    current2Index(specifiedValue) {
        let current = parseInt(typeof specifiedValue === 'number'
            ? specifiedValue : this.data.get('current'), 10) || 0;
        let currentItemId = this.data.get('currentItemId');
        if (currentItemId !== '') {
            return;
        }
        let index;
        if (!this.total) {
            index = 0;
        } else if (current < 0) {
            index = this.circular ? this.total - 1 : 0;
        } else if (current >= this.total) {
            index = this.circular ? 0 : this.total - 1;
        } else {
            index = current;
        }
        this.index = index;
    },

    /**
     * 通过currentItemId获取合法的current index
     */
    currentId2Index() {
        let id = this.data.get('currentItemId');
        let items = this.swiperSlides.children;
        let len = items.length;
        for (let i = 0; i < len; i ++) {
            let item = items[i];
            if (item.attributes['item-id']
                && item.attributes['item-id'].value
                && item.attributes['item-id'].value === (id + '')) {
                this.index = i;
                return true;
            }
        }
    },

    /**
     * 移动slider
     * @param {number} offset slider的偏移量（px）
     */
    transformSlider(offset) {
        this.offset = offset;
        let style = this.data.get('__vertical')
            ? `translate(0, ${offset}px)`
            : `translate(${offset}px, 0)`;
        this.swiperSlides.style['-webkit-transform'] = style;
        this.swiperSlides.style.transform = style;
        // img组件懒加载
        this.communicator.fireMessage({type: 'componentScroll'});
    },

    /**
     * 移动某个slider item
     * @param {number} index 元素的索引 [0, len -1]
     * @param {number} offsetPercent 偏移量 (百分比)
     */
    transformSliderItem(index, offsetPercent) {
        let item = this.swiperSlides.children[index];
        let style = this.data.get('__vertical')
            ? `translate(0, ${offsetPercent}%)`
            : `translate(${offsetPercent}%, 0)`;
        item.style['-webkit-transform'] = style;
        item.style.transform = style;
    },

    /**
     * 设置slider动画时长
     * @param {number} duration 动画时长，单位毫秒
     */
    setSliderDuration(duration) {
        this.swiperSlides.style['-webkit-transition-duration'] = duration + 'ms';
        this.swiperSlides.style.transitionDuration = duration + 'ms';
    },

    /**
     * 在衔接模式下保证视口两侧元素个数平衡
     */
    bufferReset() {
        if (!this.circular) {
            return;
        }
        // 视口左侧区域宽度，负值
        let left = this.offset + this.bufferCount * this.unitDistance;
        // 视口右侧区域宽度，正值
        let right = this.offset
            + (this.total + this.bufferCount - this.data.get('displayMultipleItems')) * this.unitDistance;
        let rlDiff = right + left;
        let unitRLDiff = rlDiff / this.unitDistance;
        let toBalance = parseInt(unitRLDiff
            / ((this.remainingCount === 1 && Math.abs(unitRLDiff) > 1 &&  Math.abs(unitRLDiff) < 2)
            ? 1 : 2), 10);
        if (toBalance > 0) {
            for (let i = 0; i < toBalance; i ++) {
                let targetIndex = this.bufferCount - 1;
                targetIndex += (targetIndex < 0) ? this.total : 0;
                let offsetPercent = (this.bufferCount > 0)
                    ? targetIndex * 100
                    : (targetIndex - this.total) * 100;
                this.transformSliderItem(targetIndex, offsetPercent);
                this.bufferCount--;
            }
        } else if (toBalance < 0) {
            for (let i = 0; i > toBalance; i--) {
                let targetIndex = this.total + this.bufferCount;
                targetIndex -= ((targetIndex >= this.total) ? this.total : 0);
                let offsetPercent = (this.bufferCount < 0)
                    ? targetIndex * 100
                    : (targetIndex + this.total) * 100;
                this.transformSliderItem(targetIndex, offsetPercent);
                this.bufferCount++;
            }
        }
    },

    /**
     * 在衔接模式下保证slider偏移量不超过总长度
     */
    slicerRangeLimit() {
        if (!this.circular) {
            return;
        }
        if (this.offset < this.offsetLimitL) {
            let offset = this.offset - this.offsetLimitL + this.offsetLimitR;
            this.transformSlider(offset);
        }
        if (this.offset > this.offsetLimitR) {
            let offset = this.offset - this.offsetLimitR + this.offsetLimitL;
            this.transformSlider(offset);
        }
    },

    /**
     * 移动到分页位置
     */
    snap() {
        let offsetUnit = this.offset / this.unitDistance;
        let quotient = parseInt(offsetUnit, 10);
        let remainder = offsetUnit % 1;
        let speedFactor = this.spotSpeed() / this.unitDistance / 2;
        let goTo = quotient;
        if (remainder < 0 && remainder + speedFactor < -0.5) {
            goTo --;
        }
        if (remainder > 0 && remainder + speedFactor > 0.5) {
            goTo ++;
        }
        if (!this.circular) {
            if (goTo > 0) {
                goTo = 0;
            }
            if (goTo  < -(this.total - this.data.get('displayMultipleItems'))) {
                goTo = -(this.total - this.data.get('displayMultipleItems'));
            }
        }
        this.setSliderDuration(parseInt(this.data.get('duration'), 10));
        this.setAnimationTimer('touch');
        this.transformSlider(goTo * this.unitDistance);
        this.bufferReset();
    },

    /**
     * 移动到this.index
     * @param {boolean} autoPlay 是否由autoPlay触发
     */
    goToIndex(autoPlay = false) {
        if (this.animationTimer) {
            this.clearAnimationTimer();
        }
        this.setSliderDuration(parseInt(this.data.get('duration'), 10));
        this.setAnimationTimer(autoPlay ? 'autoplay' : '');
        this.transformSlider(-this.index * this.unitDistance);
        this.bufferReset();
        this.setActiveSwiperDots();
        this.triggerChange(autoPlay ? 'autoplay' : '');
        if (autoPlay) {
            this.data.set('current', NaN);
            this.data.set('currentItemId', '');
        }
    },

    /**
     * 通过slider偏移量更新当前索引
     */
    updateIndexByOffset() {
        let index = -parseInt(this.offset / this.unitDistance, 10);
        this.index = this.indexRangeLimit(index);
        this.data.set('current', NaN);
        this.data.set('currentItemId', '');
    },

    indexRangeLimit(index) {
        while (index < 0) {
            index += this.total;
        }
        while (index >= this.total) {
            index -= this.total;
        }
        if (Object.is(index, -0)) {
            index = 0;
        }
        return index;
    },

    /**
     * 设置动画定时器
     * @param {string} type autoplay|touch
     */
    setAnimationTimer(type = '') {
        this.clearAnimationTimer();
        this.animationTimer = setTimeout(() => {
            this.clearAnimationTimer();
            this.setSliderDuration(0);
            this.slicerRangeLimit();
            this.bufferReset();
            this.triggerAnimationFinish(type);
        }, parseInt(this.data.get('duration'), 10));
    },

    /**
     * 清空动画计时器
     */
    clearAnimationTimer() {
        this.animationTimer && clearTimeout(this.animationTimer);
        this.animationTimer = null;
    },

    /**
     * 中止动画
     */
    stopAnimation() {
        this.setSliderDuration(0);
        if (!this.animationTimer) {
            return;
        }
        this.clearAnimationTimer();
        let transform = window.getComputedStyle(this.swiperSlides).transform.match(/-?[\d.]+/g);
        let offset = parseInt(this.data.get('__vertical') ? transform[5] : transform[4], 10);
        let oldOffset = this.offset;
        if (offset !== oldOffset) {
            this.transformSlider(offset);
        }
    },

    /**
     * 记录关键touch
     * @param {Event} event 事件对象
     */
    touchRecord(event) {
        this.second2LastTouch = this.lastTouch;
        let touch  = event.changedTouches[0];
        this.lastTouch = {
            x: touch.pageX,
            y: touch.pageY,
            time: event.timeStamp
        };
        if (!this.startTouch) {
            this.startTouch = this.lastTouch;
        }
    },

    /**
     * 通过最后两个touch计算轴方向的瞬时速度
     * @return {number} 速度px/s
     */
    spotSpeed() {
        if (!this.second2LastTouch || !this.lastTouch) {
            return 0;
        }
        let direction = this.data.get('__vertical') ? 'y' : 'x';
        let offsetDiff = this.lastTouch[direction] - this.second2LastTouch[direction];
        let timeDiff = this.lastTouch.time - this.second2LastTouch.time;
        if (offsetDiff === 0 || timeDiff === 0) {
            return 0;
        }
        return offsetDiff / timeDiff * 1000;
    },

    /**
     * 自动轮播
     */
    autoPlayOn() {
        if (this.autoplayTimer || !this.data.get('__autoplay') || this.remainingCount < 1) {
            return;
        }
        this.autoplayTimer = setInterval(() => {
            if (this.swiperSlides.children.length <= 1) {
                return;
            }
            this.index ++;
            if (this.index === this.total) {
                if (this.circular) {
                    this.setSliderDuration(0);
                    this.transformSlider(this.unitDistance);
                    this.bufferReset();
                }
                this.index = 0;
                setTimeout(() => {
                    this.goToIndex(true);
                }, 30);
            } else {
                this.goToIndex(true);
            }
        }, parseInt(this.data.get('interval'), 10));
    },

    /**
     * 关闭自动轮播
     */
    autoPlayOff() {
        if (!this.autoplayTimer) {
            return;
        }
        clearInterval(this.autoplayTimer);
        this.autoplayTimer = null;
    },

    /**
     * 触发change自定义事件
     * @param {string} type autoplay|touch
     */
    triggerChange(type = '') {
        this.dispatchEvent('bindchange', {
            detail: {
                current: this.index,
                currentItemId: this.getItemIdByIndex(),
                source: type
            }
        });
    },

    /**
     * 触发animationfinish自定义事件
     * @param {string} type autoplay|touch
     */
    triggerAnimationFinish(type = '') {
        this.dispatchEvent('bindanimationfinish', {
            detail: {
                current: this.index,
                currentItemId: this.getItemIdByIndex(),
                source: type
            }
        });
    },

    /**
     * 通过index获取swiper-item-id
     * @return {string} id
     */
    getItemIdByIndex() {
        let items = this.swiperSlides.children;
        let item = items[this.index];
        let id = '';
        if (item
            && item.attributes
            && item.attributes['item-id']
            && item.attributes['item-id'].value) {
            id = item.attributes['item-id'].value;
        }
        return id;
    }
};
