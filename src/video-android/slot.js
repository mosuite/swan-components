/**
 * @file 支持嵌套 NA 组件，兼容之前方案
 * @author wuhuiyao@baidu.com
 */

export default {

    /**
     * 初始化 Video slot
     *
     * @private
     */
    initSlot() {
        this.initSlotChildrenStyle();

        let slot = this.ref('slot');
        if (!slot || typeof MutationObserver !== 'function') {
            return;
        }

        // 由于 slot 可能会根据数据动态变化，因此如果 slot dom 结构变化，需要通知端重新
        // 更新 na 组件渲染
        let observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    this.initSlotChildrenStyle();

                    this.data.get('__isFullscreen')
                    && setTimeout(() => this.handleSlotFullscreenChange(
                        this.data.get('__isFullscreen')
                    ), 10); // 需要延后执行，否则不生效
                }
            }
        });
        observer.observe(slot, {childList: true});

        this.slotObserver = observer;
    },

    /**
     * 初始化 Slot 孩子节点样式
     *
     * @private
     */
    initSlotChildrenStyle() {
        let slot = this.ref('slot');
        let children = slot && slot.children;
        if (!children) {
            return;
        }

        for (let i = 0, len = children.length; i < len; i++) {
            let child = children[i];
            child.style.pointerEvents = 'auto';
        }
    },

    /**
     * 销毁 Slot
     *
     * @private
     */
    destroySlot() {
        let observer = this.slotObserver;
        if (observer) {
            observer.disconnect();
            this.slotObserver = null;
        }
    },

    /**
     * 处理 video 组件嵌套 NA 组件全屏变化事件处理
     *
     * @private
     * @param {boolean} isFullscreen 是否全屏
     */
    handleSlotFullscreenChange(isFullscreen) {
        let slot = this.ref('slot');
        if (!slot) {
            return;
        }

        let naComponentIds = [];
        let naElemList = [];
        let children = slot.children;
        for (let i = 0, len = children.length; i < len; i++) {
            if (children[i].tagName.toLowerCase() === 'swan-template') {
                let gradChildren = children[i].children;
                for (let k = 0, kLen = gradChildren.length; k < kLen; k++) {
                    naElemList.push(gradChildren[k]);
                }
            }
            else {
                naElemList.push(children[i]);
            }
        }
        naElemList.forEach(item => naComponentIds.push(item.id));

        if (naComponentIds.length) {
            this.boxjs.layer({
                name: (isFullscreen
                    ? 'addComponentToFullScreenSync'
                    : 'removeComponentFromFullScreenSync'),
                data: {
                    slaveId: this.slaveId,
                    componentId: naComponentIds
                }
            });
        }
    }
};
