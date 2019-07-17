/**
 * @file config
 * @author wangyang(wangyang02@baidu.com)
 */

export const config = {
    /**
     * 移动统计日志服务器地址
     *
     * @type {string}
     */
    logServerUrl: 'https://hmma.baidu.com/mini.gif',

    /**
     * 默认的可视展现比例，取值范围(0, 1]
     * 组件位于可视区域的比例大于等于该值时，认为处于可视状态
     *
     * @type {number}
     */
    defaultVisibleRatio: 0.5,

    /**
     * 默认的可视展现时长，单位是ms
     * 组件处于可视状态的时长大于等于该值时，认为完成了一次可视展现
     *
     * @type {number}
     */
    defaultVisibleDuration: 1000,

    /**
     * 请求的最大重试次数
     * 重试之前的默认延迟分别为1s、4s、16s、64s、256s...
     *
     * @const {number}
     */
    maxRequestRetryCount: 5,

    /**
     * 第一次重试之前的延迟，单位ms
     *
     * @const {number}
     */
    requestRetryFirstDelay: 1000,

    /**
     * 每次延迟增加的倍数
     *
     * @const {number}
     */
    requestRetryMultiple: 4,

    /**
     * 从存储中获取mtj_key的重试延迟，单位ms
     *
     * @const {number}
     */
    getKeyRetryDelay: 1000
};
