/**
 * @file swan的组件，在master中注入的方法
 * @author houyu(houyu01@baidu.com)
 */
import {createAnimation} from './utils/animation';
import {initSelectorQuery, initIntersectionObserver} from './utils/dom/swanXml';
import webviewEventsReciever from './web-view/webviewEventsReceiver';

export const getComponentRecievers = communicator => ({
    ...webviewEventsReciever
});

export const getContextOperators = (swaninterface, communicator, getSlaveId) => {
    const createSelectorQuery = initSelectorQuery(communicator);
    const createInitIntersectionObserver = initIntersectionObserver(communicator);

    return {
        createAnimation,
        createSelectorQuery: () => createSelectorQuery(getSlaveId()),
        createIntersectionObserver: (context, options) => createInitIntersectionObserver(getSlaveId(), context, options)
    };
};
