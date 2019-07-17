/**
 * @file bdml's file's base elements <scroll-view>
 * @author zengqingzhuang(zengqingzhuang@baidu.com)
 */
import style from './index.css';
import {internalDataComputedCreator, typesCast} from '../computedCreator';

export default {

    behaviors: ['userTouchEvents', 'noNativeBehavior', 'animateEffect'],

    template: `
        <swan-scroll-view>
            <div s-ref="wrap" class="swan-scroll-view">
                <div s-ref="main" class="swan-scroll-view scroll-view-compute-offset"
                    on-scroll="onScroll($event)"
                    on-touchend="onScrollViewTouchEnd($event)"
                    on-touchstart="onScrollViewTouchStart($event)"
                    on-touchmove="onScrollViewTouchMove($event)">
                    <div s-ref="content">
                        <slot></slot>
                    </div>
                </div>
            </div>
        </swan-scroll-view>`,

    constructor(props) {
        this.contentHeight = 0;
        this.lastLeftDistance = 0;
        this.lastTopDistance = 0;
        this.lastScrollTime = 0;
        this.startPageX = 0; // 起点横坐标
        this.startPageY = 0; // 起点纵坐标
        this.direction = ''; // 手指滑动方向，一旦确认方向不可变更
        this.isAutoHeight = false; // 高度自适应
    },

    initData() {
        return {
            upperThreshold: 50, // 距顶部/左边多远时（单位px），触发 scrolltoupper 事件
            lowerThreshold: 50, // 距底部/右边多远时（单位px），触发 scrolltolower 事件
            scrollY: false, // 允许纵向滚动
            scrollX: false, // 允许横向滚动
            scrollLeft: 0, // 设置横向滚动条位置
            scrollTop: 0, // 设置竖向滚动条位置
            scrollWithAnimation: false, // 是否动画过渡
            scrollIntoView: '', // 元素id,滚动到该元素
            enableBackToTop: false
        };
    },

    computed: {
        ...internalDataComputedCreator([
            {name: 'upperThreshold', caster: typesCast.numCast, default: 50},
            {name: 'lowerThreshold', caster: typesCast.numCast, default: 50},
            {name: 'scrollY', caster: typesCast.boolCast},
            {name: 'scrollX', caster: typesCast.boolCast},
            {name: 'scrollLeft', caster: typesCast.numCast},
            {name: 'scrollTop', caster: typesCast.numCast},
            {name: 'scrollWithAnimation', caster: typesCast.boolCast},
            {name: 'scrollIntoView', caster: typesCast.stringCast},
            {name: 'enableBackToTop', caster: typesCast.boolCast}
        ])
    },

    attached() {
        let pageData = this.data.get();
        this.wrap = this.ref('wrap');
        this.main = this.ref('main');
        this.content = this.ref('content');
        this.watchParams();
        this.isBackToTop();
        this.scrollXChanged();
        this.scrollYChanged();
        pageData.__scrollIntoView && this.scrollIntoViewChanged();
        pageData.__scrollLeft && this.scrollLeftChanged();
        pageData.__scrollTop && this.scrollTopChanged();

        this.communicator.onMessage('fullscreenchange', message => {
            let data = message && message.data;
            // 对于 ios 同层渲染，全屏时候需要禁用掉手势监听
            this.isVideoFullscreen = data
                && data.isVideoFullscreenChange
                && data.isFullscreen;
        });
    },

    /**
     * 监听用户传入参数变化
     */
    watchParams() {
        this.watch('scrollLeft', leftVal => {
            if (leftVal || parseInt(leftVal, 10) === 0) {
                this.main.style.webkitOverflowScrolling = 'auto';
                this.scrollLeftChanged();
            }
        });
        this.watch('scrollTop', topVal => {
            if (topVal || parseInt(topVal, 10) === 0) {
                this.main.style.webkitOverflowScrolling = 'auto';
                this.scrollTopChanged();
            }
        });
        this.watch('scrollIntoView', value => {
            value && this.scrollIntoViewChanged();
        });
        this.watch('scrollX', value => {
            this.scrollXChanged();
            this.scrollYChanged();
        });
        this.watch('scrollY', value => {
            this.scrollXChanged();
            this.scrollYChanged();
        });
    },

    /**
     * 数据变更重新计算样式
     */
    slaveUpdated() {
        if (this.data.get('__scrollX') && (this.contentHeight !== this.content.offsetHeight)) {
            this.contentHeight = this.content.offsetHeight;
            this.scrollXChanged();
        }
    },

    /**
     * 接收并响应page.js中接收的端上派发的点击标题回调
     */
    isBackToTop() {
        this.communicator.onMessage('scrollView-backTotop', () => {
            this.data.get('__enableBackToTop') && this.scrollTo(0, 'y');
        });
    },

    /**
     * 横向滚动样式设置
     */
    scrollXChanged() {
        if (this.data.get('__scrollX')) {
            this.checkIsAutoHeight();
            this.main.style.overflowX = 'auto';
            this.main.style.overflowY = 'hidden';
            this.main.style.paddingBottom = '20px';
            this.wrap.style.overflowY = 'hidden';
            this.isAutoHeight
                ? (this.wrap.style.height = this.content.offsetHeight + 'px', this.content.style.height = '')
                : (this.wrap.style.height = '', this.content.style.height = this.el.offsetHeight + 'px');
        } else {
            this.wrap.style.overflowY = '';
            this.wrap.style.height = '';
            this.main.style.overflowX = 'hidden';
            this.main.style.paddingBottom = '';
            this.content.style.height = '100%';
        }
    },

    /**
     * 检查容器高度是否自适应
     */
    checkIsAutoHeight() {
        this.wrap.style.height = 0;
        const style = getComputedStyle(this.el);
        this.isAutoHeight = parseFloat(style.height) === 0 ? true : false;
    },

    /**
     * 竖向滚动样式设置
     */
    scrollYChanged() {
        this.main.style.overflowY = this.data.get('__scrollY') ? 'auto' : 'hidden';
    },

    /**
     * 横向滚动条位置
     */
    scrollLeftChanged() {
        const scrollLeft = this.data.get('__scrollLeft');
        this.data.get('__scrollWithAnimation') ? this.scrollTo(scrollLeft, 'x')
            : (this.main.scrollLeft = scrollLeft, this.main.style.webkitOverflowScrolling = 'touch');
    },

    /**
     * 竖向滚动条位置
     */
    scrollTopChanged() {
        const scrollTop = this.data.get('__scrollTop');
        this.data.get('__scrollWithAnimation') ? this.scrollTo(scrollTop, 'y')
            : (this.main.scrollTop = scrollTop, this.main.style.webkitOverflowScrolling = 'touch');
    },

    /**
     * 滚动到某个元素位置
     */
    scrollIntoViewChanged() {
        const pageData = this.data.get();
        const scrollIntoViewId = pageData.__scrollIntoView;
        if (scrollIntoViewId) {
            const scrollTarget = this.main.querySelector(`#${scrollIntoViewId}`);
            if (scrollTarget) {
                const targetScroll = scrollTarget.getBoundingClientRect();
                const mainScroll = this.main.getBoundingClientRect();
                if (pageData.__scrollX) {
                    const scrollLeft = this.main.scrollLeft + targetScroll.left - mainScroll.left;
                    // 组件是从上到下依次渲染，scroll-view下方dom结构会影响其高度，需要放到nextTick中
                    this.nextTick(() => {
                        pageData.__scrollWithAnimation
                            ? this.scrollTo(scrollLeft, 'x')
                            : this.main.scrollLeft = scrollLeft;
                    });
                }
                if (pageData.__scrollY) {
                    const scrollTop = this.main.scrollTop + targetScroll.top - mainScroll.top;
                    this.nextTick(() => {
                        pageData.__scrollWithAnimation
                            ? this.scrollTo(scrollTop, 'y')
                            : this.main.scrollTop = scrollTop;
                    });
                }
            }
        }
    },

    /**
     * 滚动到某个元素位置
     * @param {number} [scrollValue] 横/竖向滚动条位置
     * @param {number} [direction] 滚动方向
     */
    scrollTo(scrollValue, direction) {
        const maxScrollWidth = this.main.scrollWidth - this.main.offsetWidth;
        const maxScrollHeight = this.main.scrollHeight - this.main.offsetHeight;
        let style = '';
        let canMoveDis = 0; // 可以滑动的距离
        if (scrollValue < 0) {
            scrollValue = 0;
        } else if (direction === 'x' && scrollValue > maxScrollWidth) { // 横向
            scrollValue = maxScrollWidth;
        } else if (direction === 'y' && scrollValue > maxScrollHeight) { // 竖向
            scrollValue = maxScrollHeight;
        }
        direction === 'x' ? (canMoveDis = this.main.scrollLeft - scrollValue)
            : direction === 'y' && (canMoveDis = this.main.scrollTop - scrollValue);
        if (canMoveDis !== 0) {
            this.content.removeEventListener('transitionend', this._transitionEnd);
            this.content.removeEventListener('webkitTransitionEnd', this._transitionEnd);
            this._transitionEnd = this.transitionEnd.bind(this, scrollValue, direction);
            this.content.addEventListener('transitionend', this._transitionEnd);
            this.content.addEventListener('webkitTransitionEnd', this._transitionEnd);
            this.content.style.transition = 'transform .3s ease-out';
            this.content.style.webkitTransition = '-webkit-transform .3s ease-out';
            direction === 'x' ? style = 'translateX(' + canMoveDis + 'px) translateZ(0)'
                : style = 'translateY(' + canMoveDis + 'px) translateZ(0)';
            this.content.style.transform = style;
            this.content.style.webkitTransform = style;
        }
    },

    /**
     * 动画结束执行的操作
     * @param {number} [scrollValue] 横/竖向滚动条位置
     * @param {number} [direction] 滚动方向
     */
    transitionEnd(scrollValue, direction) {
        Object.assign(this.content.style, {
            transition: '',
            webkitTransition: '',
            transform: '',
            webkitTransform: ''
        });
        direction === 'x' && (this.main.scrollLeft = scrollValue);
        direction === 'y' && (this.main.scrollTop = scrollValue);
        this.main.style.webkitOverflowScrolling = 'touch';
        this.content.removeEventListener('transitionend', this._transitionEnd);
        this.content.removeEventListener('webkitTransitionEnd', this._transitionEnd);
    },

    /**
     * 滑动时的4方位距离的计算函数
     * @param {Object} [target] DOM事件对象
     * @return {Object} 4方位距离
     */
    computeScrollRect(target) {
        return {
            rightDistance: target.scrollWidth - target.scrollLeft - target.clientWidth,
            bottomDistance: target.scrollHeight - target.scrollTop - target.clientHeight,
            topDistance: target.scrollTop,
            leftDistance: target.scrollLeft
        };
    },

    /**
     * 判断是否需要横/纵向滑动
     * @param {Object} [target] 滑动原生对象
     * @param {string} [type] 横/纵类型
     * @return {boolean} 判断在此方向上，是否需要处理滑动函数
     */
    shouldProccessScroll(target, type) {
        // 如果clientWidth比scrollWidth小，证明有必要触发一下，如果clientWidth比scrollWidth还大的话，证明没必要触发scrolltolower了,
        // 所以叫noNeedWidthScroll
        if (type === 'x') {
            const noNeedWidthScroll = target.clientWidth >= target.scrollWidth;
            return this.data.get('__scrollX') && !noNeedWidthScroll;
        }
        const noNeedHeightScroll = target.clientHeight >= target.scrollHeight;
        return this.data.get('__scrollY') && !noNeedHeightScroll;
    },

    /**
     * 计算滑动的方向的事件派发，依据滑动的方向，滑动到的位置是否符合传入条件，是否设置过scroll滑动事件，来判断触发何种事件
     * @param {Object} [$event] 滑动产生的事件对象
     * @return {Array} 所有需要触发的directions
     */
    computeScrollDirection(target) {
        const {topDistance, leftDistance, rightDistance, bottomDistance} = this.computeScrollRect(target);
        const deltaX = this.lastLeftDistance - leftDistance;
        const deltaY = this.lastTopDistance - topDistance;
        const scrollingRight = deltaX < 0;
        const scrollingLeft = deltaX > 0;
        const scrollingUp = deltaY > 0;
        const scrollingDown = deltaY < 0;
        const scrollDirections = ['bindscroll'];
        // 是否横向触发lower
        const horizontalTriggerLower = this.shouldProccessScroll(target, 'x')
                && rightDistance <= this.data.get('__lowerThreshold') && scrollingRight;
        // 是否纵向触发lower
        const verticalTriggerLower = this.shouldProccessScroll(target, 'y')
                && bottomDistance <= this.data.get('__lowerThreshold') && scrollingDown;
        // 是否横向触发upper
        const horizontalTriggerUpper = this.shouldProccessScroll(target, 'x')
                && leftDistance <= this.data.get('__upperThreshold') && scrollingLeft;
        // 是否纵向触发upper
        const verticalTriggerUpper = this.shouldProccessScroll(target, 'y')
                && topDistance <= this.data.get('__upperThreshold') && scrollingUp;

        if (horizontalTriggerLower || verticalTriggerLower) {
            scrollDirections.push('bindscrolltolower');
        }

        if (horizontalTriggerUpper || verticalTriggerUpper) {
            scrollDirections.push('bindscrolltoupper');
        }
        return scrollDirections;
    },

    /**
     * 拼接fire开发者回调事件数据
     * @param {Object} [target] DOM事件目标对象
     * @return {Object} 滚动相关数据
     */
    getScrollData(target) {
        return {
            detail: {
                deltaX: target.deltaX,
                deltaY: target.deltaY,
                scrollHeight: target.scrollHeight,
                scrollWidth: target.scrollWidth,
                scrollTop: target.scrollTop,
                scrollLeft: target.scrollLeft
            }
        };
    },

    /**
     * 原生滚动条事件
     * @param {Object} [$event] DOM事件对象
     */
    onScroll($event) {
        if (this.isVideoFullscreen) {
            return;
        }

        $event.preventDefault();
        $event.stopPropagation();
        if ($event.timeStamp - this.lastScrollTime < 20) { // 防止频繁计算导致卡顿问题
            return;
        }
        this.data.set('scrollTop', '');
        this.data.set('scrollLeft', '');
        this.data.set('scrollIntoView', '');
        this.contentHeight = this.content.offsetHeight;
        this.lastScrollTime = $event.timeStamp;
        const target = $event.target;
        Object.assign(target, {
            deltaX: this.lastLeftDistance - target.scrollLeft,
            deltaY: this.lastTopDistance - target.scrollTop
        });
        this.computeScrollDirection(target)
        .forEach(direction => {
            target.type = direction === 'bindscroll' ? 'scroll'
            : (direction === 'bindscrolltoupper' ? 'upper' : (direction === 'bindscrolltolower' ? 'lower' : ''));
            this.dispatchEvent(direction, this.getScrollData(target));
        });
        this.lastLeftDistance = target.scrollLeft;
        this.lastTopDistance = target.scrollTop;
        // image组件懒加载
        this.communicator.fireMessage({type: 'componentScroll'});
    },

    onScrollViewTouchStart($event) {
        if (this.isVideoFullscreen) {
            return;
        }

        const touch = $event.changedTouches[0];
        this.startPageX = touch.pageX;
        this.startPageY = touch.pageY;
        // 触发layout ios下 fixed scroll卡死的问题 patch
        if (this.swaninterface.boxjs.platform.isIOS() && this.data.get('__scrollX')) {
            this.main.style.overflowY = '';
        }
        if (this.swaninterface.boxjs.platform.isIOS() && this.data.get('__scrollY')) {
            this.main.style.overflowX = '';
        }
        // 阻止ios webview回弹效果
        this.swaninterface.boxjs.platform.isIOS() && this.boxjs.ui.close({
            name: 'swan-springback'
        });
        // 阻止 android 端下拉刷新
        this.swaninterface.boxjs.platform.isAndroid() && this.boxjs.ui.open({
            name: 'swan-preventPullDownRefresh',
            data: {
                prevent: true,
                slaveId: `${this.slaveId}`
            }
        });
    },

    onScrollViewTouchMove($event) {
        if (this.isVideoFullscreen) {
            return;
        }

        const touch = $event.changedTouches[0];
        // 触发layout ios下 fixed scroll卡死的问题 patch
        if (this.swaninterface.boxjs.platform.isIOS() && this.data.get('__scrollX') && this.direction === 'x') {
            this.main.style.overflowY = 'hidden';
        }
        if (this.swaninterface.boxjs.platform.isIOS() && this.data.get('__scrollY') && this.direction === 'y') {
            this.main.style.overflowX = 'hidden';
        }
        if (!this.direction) {
            Math.abs(touch.pageX - this.startPageX) >= Math.abs(touch.pageY - this.startPageY)
                ? this.direction = 'x' : this.direction = 'y';
        }
    },

    onScrollViewTouchEnd($event) {
        if (this.isVideoFullscreen) {
            return;
        }

        this.direction = '';
        // 开启ios webview回弹效果
        this.swaninterface.boxjs.platform.isIOS() && this.boxjs.ui.open({
            name: 'swan-springback'
        });
        // 开启 android 端下拉刷新
        this.swaninterface.boxjs.platform.isAndroid() && this.boxjs.ui.open({
            name: 'swan-preventPullDownRefresh',
            data: {
                prevent: false,
                slaveId: `${this.slaveId}`
            }
        });
    }
};
