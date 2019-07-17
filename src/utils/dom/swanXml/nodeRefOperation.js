/**
 * @file swan xml querySelector nodeRef operation
 * @author yican(yangtianyi01@baidu.com)
 */


export class NodeRefOperation {

    constructor(selector, slaveId, selectorContext) {
        this.component = '';
        this.selector = selector;
        this.selectorQuery = selectorContext;
        this.queryType = '';
        this.selectorContext = selectorContext;
        this.slaveId = slaveId;
    }

    getSelectorInfoData({component, fields, selector, queryType, operation}) {
        return {
            component,
            fields,
            selector,
            queryType,
            operation
        };
    }

    boundingClientRect(cb) {
        const selectorInfoData = this.getSelectorInfoData({
            component: this.component,
            fields: {},
            selector: this.selector,
            queryType: this.queryType,
            operation: 'boundingClientRect'
        });
        this.selectorContext.queue.push(selectorInfoData);
        this.selectorContext.queueCb.push(cb || null);
        return this.selectorContext;
    }

    fields(fields = {}, cb) {
        const selectorInfoData = this.getSelectorInfoData({
            component: this.component,
            fields,
            selector: this.selector,
            queryType: this.queryType,
            operation: 'fields'
        });
        this.selectorContext.queue.push(selectorInfoData);
        this.selectorContext.queueCb.push(cb || null);
        return this.selectorContext;
    }

    scrollOffset(cb) {
        const selectorInfoData = this.getSelectorInfoData({
            component: this.component,
            fields: {},
            selector: this.selector,
            queryType: this.queryType,
            operation: 'scrollOffset'
        });
        this.selectorContext.queue.push(selectorInfoData);
        this.selectorContext.queueCb.push(cb || null);
        return this.selectorContext;
    }

}
