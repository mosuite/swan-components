/**
 * @file log
 *
 * @author yangzongjun(yangzongjun@baidu.com)
 * @date 2019-04-03
 */

// 打点数据，全局存储，每个slave一份
const __logData = {
    baseLogInfo: {}, // 打点基础信息
    componentAttachLog: {
        logId: 833,
        list: [],
        timer: null,
        isLogEnded: false, // config.delayTime后不统计
        config: {
            delayTime: 5000, // 首屏最迟上传延时
            maxAmount: 500 // 个数多于此值上传
        }
    },
    componentErrorLog: {
        logId: 935,
        list: [],
        timer: null,
        isLogEnded: false, // config.delayTime后不统计
        config: {
            delayTime: 5000, // 首屏最迟上传延时
            maxAmount: 500 // 个数多于此值上传
        }
    }
};

/**
 * 获取小程序基本信息
 */
function initBaseLogInfo() {
    if (!__logData.baseLogInfo.appInfo) {
        try {
            __logData.baseLogInfo.appInfo = this.boxjs.data.get({name: 'swan-appInfoSync'});
        }
        catch (error) {
            console.log(error);
            __logData.baseLogInfo.appInfo = {};
        }
    }
    if (!__logData.baseLogInfo.systemInfo) {
        try {
            __logData.baseLogInfo.systemInfo = this.boxjs.device.systemInfo({type: 'sync'});
        }
        catch (error) {
            console.log(error);
            __logData.baseLogInfo.systemInfo = {};
        }
    }
}

/**
 * 组件attach打点 发送
 *
 * @param {string} logType 日志类型
 */
function sendComponentStatistics(logType) {
    let logData = __logData[logType]; // 保留attach打点数据的引用
    initBaseLogInfo.call(this);
    let baseLogInfo = __logData.baseLogInfo;

    const data = {};
    logData.list.forEach(item => {
        const curTag = item.subTag;
        if (data[curTag]) {
            data[curTag].count++;
            data[curTag].duration = data[curTag].duration + item.duration;
        } else {
            item.count = 1;
            data[curTag] = item;
        }
    });
    const ubcReportData = {
        actionId: logData.logId,
        value: {
            from: 'swan',
            ext: {
                appkey: baseLogInfo.appInfo.appid,
                appVersion: baseLogInfo.systemInfo.SDKVersion,
                pagePath: global.pageInfo && global.pageInfo.pagePath,
                list: []
            }
        }
    };
    const logParams = {
        groupId: '16',
        bizId: '45',
        swanType: 'swan',
        eventName: 'open@success',
        content: {
            ext: {
                from: 'h5',
                appkey: baseLogInfo.appInfo.appid,
                list: []
            }
        }
    };
    Object.keys(data).forEach(key => {
        let listObj = {
            componentName: data[key].params.componentName || data[key].subTag,
            count: data[key].count,
            duration: Math.floor(data[key].duration / data[key].count * 100) / 100
        };
        ubcReportData.value.ext.list.push(listObj);
        logParams.content.ext.list.push(listObj);
    });
    this.boxjs.log({
        name: 'ubcReport',
        data: ubcReportData
    });
    this.boxjs.log({
        name: 'statisticEvent',
        data: logParams
    });
    logData.list = [];
}


/**
 * 稳定性打点 发送
 *
 * @param {string} logType 日志类型
 */
function sendLogStability(logType) {
    let logData = __logData[logType]; // 保留935 稳定性打点logData的引用
    initBaseLogInfo.call(this);
    let baseLogInfo = __logData.baseLogInfo;

    let listObj = {};
    logData.list.forEach(item => {
        if (listObj[item]) {
            listObj[item]++;
        }
        else {
            listObj[item] = 1;
        }
    });
    this.boxjs.log({
        name: 'ubcReport',
        data: {
            actionId: logData.logId,
            value: {
                from: 'swan',
                ext: {
                    appkey: baseLogInfo.appInfo.appid,
                    appVersion: baseLogInfo.systemInfo.SDKVersion,
                    pagePath: global.pageInfo && global.pageInfo.pagePath,
                    position: listObj
                }
            }
        }
    });
    logData.list = [];
}

/**
 * 发送打点
 *
 * @param {string} logType 打点类型
 */
function sendLog(logType) {
    switch (logType) {
        // attach打点
        case 'componentAttachLog':
            sendComponentStatistics.call(this, logType);
            break;
        // 有资源加载的组件的error打点
        case 'componentErrorLog':
            sendLogStability.call(this, logType);
            break;
        default:
            break;
    }
}

/**
 * 把新增log push到数组中，满足个数或时间限制则发送打点
 *
 * @param {string} logType 打点类型
 * @param {Object} logItem 打点item
 */
export function pushLogItem(logType, logItem) {
    let logData = __logData[logType]; // 保留打点logData的引用
    if (logData.isLogEnded) {
        return;
    }

    if (!logData.timer) {
        // 页面退出时slave的setTimeout不会执行，此时丢弃
        logData.timer = setTimeout(() => {
            sendLog.call(this, logType);
            logData.isLogEnded = true;
        }, logData.config.delayTime);
    }
    logData.list.push(logItem);

    if (logData.list.length >= logData.config.maxAmount) {
        sendLog.call(this, logType);
    }
}
