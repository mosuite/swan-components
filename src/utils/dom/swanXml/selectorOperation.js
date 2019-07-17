/**
 * @file swan xml querySelector operation
 * @author yican(yangtianyi01@baidu.com)
 */

import {NodeRefOperation} from './nodeRefOperation';
import {convertToCustomComponentSelector} from './parseDataUtil';

let execId = 0;

let selectionInstanceMap = {};
class SelectorOperation {

    constructor(slaveId, communicator) {
        this.component = '';
        this.defaultComponent = {};
        this.queue = [];
        this.queueCb = [];
        this.slaveId = slaveId;
        this.nodeRef = {};
        this.communicator = communicator;
        this.execCallback = {};
        this.contextId = null;
        this.componentName = '';
    }

    /**
     * [select function]
     * @param  {[type]} selector [One or more CSS selectors separated by commas]
     * @param  {[type]} el       [element]
     * @return {[type]}          [The element found, if any]
     */
    select(selector) {
        // 如果实例中有contextId就是在自定义组件中，为了区分class生效的域，给自定义组件里的class加了前缀，这里兼容，下同
        selector = this.contextId ? convertToCustomComponentSelector(selector, this.componentName) : selector;
        this.nodeRef = new NodeRefOperation(selector, this.slaveId, this);
        this.nodeRef.queryType = 'select';
        return this.nodeRef;
    }

    /**
     * [select function]
     * @param  {[type]} selector [ One or more CSS selectors separated by commas]
     * @param  {[type]} el       [ element]
     * @return {[type]}          [description]
     */
    selectAll(selector) {
        selector = this.contextId ? convertToCustomComponentSelector(selector, this.componentName) : selector;
        this.nodeRef = new NodeRefOperation(selector, this.slaveId, this);
        this.nodeRef.queryType = 'selectAll';
        return this.nodeRef;
    }

    selectViewport() {
        this.nodeRef = new NodeRefOperation('', this.slaveId, this);
        this.nodeRef.queryType = 'selectViewport';
        return this.nodeRef;
    }

    // in(component) {
    //     return;
    // }

    exec(cb) {
        const context = this;
        // 通过execId来保存至map中，在slave传回dom的相关属性后，通过execId来找回是哪一个实例
        execId++;
        selectionInstanceMap[execId] = {
            queueCb: context.queueCb,
            execCallback: context.execCallback
        };

        if (Object.prototype.toString.call(cb).indexOf('Function') > -1) {
            this.execCallback[execId] = {cb: cb, resultArray: []};
        }

        // 取对应selector 发送消息到slave
        const len = this.queue.length;
        for (let index = 0; index < len; index++) {
            const {selector, queryType, operation, fields} = this.queue[index];
            this._querySlaveSelector({
                slaveId: this.slaveId,
                selector,
                queryType,
                index,
                operation,
                fields,
                execId
            });
        }
    }

    in(component) {
        this.contextId = component.nodeId;
        this.component = component;
        this.componentName = component.componentName;
        return this;
    }

    /**
     * 把需要计算的数据丢给slave，master上拿不到dom的相关数据
     *
     * @param {Object} obj - 用到querySelect的相关数据
     */
    _querySlaveSelector({slaveId, selector, queryType, index, operation, fields, execId}) {
        this.communicator.sendMessage(
            slaveId,
            {
                type: 'querySlaveSelector',
                value: {
                    selector,
                    queryType,
                    index,
                    operation,
                    fields,
                    execId,
                    contextId: this.contextId
                }
            }
        );

    }
}

/**
 * 初始化selector生成器
 *
 * @param {Object} communicator - 监听的事件流对象
 * @return {Function} 创建selector的生成器
 */
export const initSelectorQuery = communicator => {
    // 接收从slave传回的dom的相关数据，通过上面维护的map和execId来找到对应回调
    communicator.onMessage('getSlaveSelector', params => {
        const {slaveId, value} = params;
        const paramsValue = JSON.parse(value);
        const {index, data, execId} = paramsValue;
        let selection = selectionInstanceMap[execId];
        if (selection) {
            selection.queueCb[index] && selection.queueCb[index](data);
            // exec callback
            let execCallbackInfo = selection.execCallback[execId];
            if (execCallbackInfo) {
                execCallbackInfo.resultArray[index] = paramsValue.data;
                let currentResultArraySize = execCallbackInfo.resultArray.filter(info => info !== undefined).length;
                if (currentResultArraySize === selection.queueCb.length) {
                    execCallbackInfo.cb.apply(null, [execCallbackInfo.resultArray]);
                }
            }
        }
    });
    return slaveId => new SelectorOperation(slaveId, communicator);
};
