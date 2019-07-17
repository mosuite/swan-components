/**
 * @file 构造组件的工具
 * @author liuyuekeng, yanghuabei(yanghuabei@baidu.com)
 */

import {getComponentFactory} from '../../mock/swan-core/component-factory';
import {getComponents, getBehaviorDecorators} from '../../../src/index';
import swaninterface from '../swan-api/swaninterface';
const componentDefaultProps = {
    swaninterface: swaninterface()
};
const {versionCompare, boxVersion} = swaninterface().boxjs.platform;
const getComponentsProtos = getComponents({
    isIOS: true,
    versionCompare,
    boxVersion
});
export default function buildComponent(name, componentProto, ...args) {
    let unitTestParams = {};
    try {
        unitTestParams = args[0].data && args[0].data.unitTestParams;
    }
    catch (error) {
        // console.log('build error', error);
    }
    const componentFactory = getComponentFactory({
        swaninterface: swaninterface(unitTestParams)
    }, getComponentsProtos, getBehaviorDecorators());
    componentProto = componentFactory.mergeComponentProtos(componentProto, swaninterface(unitTestParams));
    componentFactory.componentDefine(name, componentProto);
    const Component = componentFactory.getComponents(name);
    return new Component(...args);
}

/**
 * 生成一个组件类
 *
 * @param {string} name 组件名，一般是在用户在开始使用的标签名
 * @param {Object} componentProto 组件原型属性和方法的集合
 * @return {san.Component}
 */
export function getComponentClass(name, componentProto, ...args) {
    let unitTestParams = {};
    try {
        unitTestParams = args[0].data && args[0].data.unitTestParams;
    }
    catch (error) {
        // console.log(error);
    }

    const componentFactory = getComponentFactory({
        swaninterface: swaninterface(unitTestParams)
    }, getComponentsProtos, getBehaviorDecorators());
    componentProto = componentFactory.mergeComponentProtos(componentProto, swaninterface(unitTestParams));
    componentFactory.componentDefine(name, componentProto);
    return componentFactory.getComponents(name);
}

/**
 * 获取组件工厂类
 */
export function getFactory() {
    return getComponentFactory({
        swaninterface: swaninterface()
    }, getComponentsProtos, getBehaviorDecorators());
}
