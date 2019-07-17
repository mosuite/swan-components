/**
 * @file Intersection Observer API
 * @author wuxiaopan(wuxiaopan@baidu.com)
 */

// master 和 slave 每次通信的标识
let reqId = 0;
// 存储与 reqId 绑定的回调函数
let callbackMap = {};

export const initIntersectionObserver = communicator => {
    communicator.onMessage('responseComponentObserver', params => {
        // 执行 reqId 对应回调
        callbackMap[params.value.reqId](params.value);
    });

    return (slaveId, context, options) => new IntersectionObserver({
        slaveId,
        communicator,
        context,
        options
    });
};

class IntersectionObserver {

    constructor({slaveId, communicator, context, options}) {
        this._component = context || {};
        this._observerId = null;
        this._options = {
            thresholds: [0],
            initialRatio: 0,
            selectAll: false,
            ...options
        };
        this._relativeInfo = [];
        this._disconnected = false;
        this._slaveId = slaveId;
        this.communicator = communicator;
    }

    /**
     * 使用选择器指定一个节点，作为参照区域之一。
     *
     * @param  {string} selector       选择器
     * @param  {Object} margins        用来扩展（或收缩）参照节点布局区域的边界
     * @param  {number} margins.left   left
     * @param  {number} margins.right  right
     * @param  {number} margins.top    top
     * @param  {number} margins.bottom bottom
     * @return {Object} this
     */
    relativeTo(selector, margins) {
        if (this._observerId !== null) {
            throw new Error('"observe" call can be only called once in IntersectionObserver');
        }
        this._relativeInfo.push({
            selector,
            margins
        });
        return this;
    }

    /**
     * 指定页面显示区域作为参照区域之一
     *
     * @param  {Object} margins        用来扩展（或收缩）参照节点布局区域的边界
     * @param  {number} margins.left   left
     * @param  {number} margins.right  right
     * @param  {number} margins.top    top
     * @param  {number} margins.bottom bottom
     * @return {Object} this
     */
    relativeToViewport(margins) {
        if (this._observerId !== null) {
            throw new Error('Relative nodes cannot be added after "observe" call in IntersectionObserver');
        }
        this._relativeInfo.push({
            selector: null,
            margins
        });
        return this;
    }

    /**
     * 指定目标节点并开始监听相交状态变化情况
     *
     * @param  {string}   targetSelector 目标节点
     * @param  {Function} callback       回调函数
     * @return {undefined}
     */
    observe(targetSelector, callback) {
        let self = this;
        if (!this._relativeInfo.length) {
            console.warn('Intersection observer will be ignored because no relative nodes are found');
            return;
        }
        if (this._observerId !== null) {
            throw new Error('"observe" call can be only called once in IntersectionObserver');
        }

        this._observerId = '';
        this._relativeInfo.forEach(item => {
            item.margins = {
                ...{top: 0, left: 0, right: 0, bottom: 0},
                ...item.margins
            };
        });

        // 判断是否为自定义组件
        let isCustomComponent = typeof this._component.nodeId === 'string';
        this._sendMessage({
            operationType: 'add',
            data: {
                targetSelector,
                relativeInfo: this._relativeInfo,
                options: this._options,
                contextId: isCustomComponent ? this._component.nodeId : '',
                componentName: isCustomComponent ? this._component.componentName : ''
            },
            callback(res) {
                let {reqId, observerId, data} = res;
                if (!this._disconnected) {
                    observerId && (this._observerId = observerId);
                }
                data && callback(data);
            }
        });
    }

    /**
     * 停止监听。回调函数将不再触发。
     *
     * @return {undefined}
     */
    disconnect() {
        this._sendMessage({
            operationType: 'remove',
            callback(res) {
                let {reqId, reqEnd} = res;
                if (reqEnd) {
                    this._disconnected = true;
                    delete callbackMap[reqId];
                }
            }
        });
    }

    /**
     * 往 slave 派发 Intersection Observer 相关事件
     *
     * @param  {string} options.operationType  add/remove
     * @param  {string} options.data  传递的参数
     * @param  {string} options.callback  reqId 返回后的回调
     * @return {undefined}
     */
    _sendMessage({operationType, data, callback}) {
        reqId++;
        callbackMap[reqId] = callback.bind(this);

        this.communicator.sendMessage(
            this._slaveId,
            {
                type: 'requestComponentObserver',
                operationType,
                value: {
                    reqId,
                    slaveId: this._slaveId,
                    observerId: this._observerId,
                    ...data
                }
            }
        );
    }
}
