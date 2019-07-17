/**
 * @file web-view组件单测
 * @author yanghuabei@baidu.com
 */

import WebView from '../../../src/web-view';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import Communicator from '../../mock/communicator';
import sinon from 'sinon';
const COMPONENT_NAME = 'web-view';

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, WebView);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            const $swanWebView = $component.querySelector('swan-web-view');
            expect($swanWebView).not.toBe(null);
            expect($swanWebView.firstChild).toBe(null);
            component.dispose();
        });
    });

    const component2 = buildComponent(COMPONENT_NAME, WebView);
    const $component2 = attach2Document(component2);
    it('should remove native component while detached', () => {
        const spy = sinon.spy(component2.boxjs.webView, 'remove');
        component2.dispose();
        expect(spy.calledOnce).toBe(true);
        spy.restore();
    });

    it('should insert native component while first slaveRendered, update it while subsequent slaveUpdated', done => {
        const component3 = buildComponent(COMPONENT_NAME, WebView, {
            data: {
                src: 'https://www.baidu.com'
            }
        });
        const insert = sinon.spy(component3.boxjs.webView, 'insert');
        const update = sinon.spy(component3.boxjs.webView, 'update');

        const $component3 = attach2Document(component3);
        component3.nextTick(() => {
            expect(insert.calledOnce).toBe(true);
            component3.data.set('hidden', true);
            // test中通过data.set改变字段不会自动触发 slaveUpdated，需要手动触发
            component3.communicator.fireMessage({type: 'slaveUpdated'});
            component3.nextTick(() => {
                expect(update.calledOnce).toBe(true);
                component3.dispose();
                done();
            });
        });
    });
});

describe('check api fail', () => {

    it('should insert fail', done => {
        const component = buildComponent(
            COMPONENT_NAME,
            WebView,
            {
                data: {
                    src: 'https://www.baidu.com',
                    unitTestParams: {
                        apiExecResult: ['insertFail']
                    }
                }
            }
        );
        const spy = sinon.spy(component, 'logStability');
        const $component = attach2Document(component);
        setTimeout(() => {
            expect(spy.callCount).toBe(1);
            spy.restore();
            component.dispose();
            done();
        }, 1000);
    });

    it('should update fail', done => {
        const component = buildComponent(
            COMPONENT_NAME,
            WebView,
            {
                data: {
                    src: 'https://www.baidu.com',
                    unitTestParams: {
                        apiExecResult: ['updateFail']
                    }
                }
            }
        );
        const spy = sinon.spy(component, 'logStability');
        const $component = attach2Document(component);
        component.nextTick(() => {
            component.data.set('src', 'http://abc.com');
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
        });
        setTimeout(() => {
            expect(spy.callCount).toBe(1);
            spy.restore();
            component.dispose();
            done();
        }, 1000);
    });

    it('should remove fail', done => {
        const component = buildComponent(
            COMPONENT_NAME,
            WebView,
            {
                data: {
                    src: 'https://www.baidu.com',
                    unitTestParams: {
                        apiExecResult: ['removeFail']
                    }
                }
            }
        );
        const spy = sinon.spy(component, 'dispatch');
        const $component = attach2Document(component);
        component.nextTick(() => {
            expect(spy.callCount).toBe(1);
            component.dispose();
            done();
        });
    });

    it('should not update while no attr change', done => {
        const component = buildComponent(
            COMPONENT_NAME,
            WebView,
            {
                data: {
                    src: 'https://www.baidu.com'
                }
            }
        );
        const spy = sinon.spy(component.boxjs.webView, 'update');
        const $component = attach2Document(component);
        component.nextTick(() => {
            component.data.set('src', 'https://www.baidu.com');
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            expect(spy.callCount).toBe(0);
            component.dispose();
            done();
        });
    });

    it('should insert while not inserted', done => {
        const component = buildComponent(
            COMPONENT_NAME,
            WebView,
            {
                data: {
                    src: 'https://www.baidu.com'
                }
            }
        );
        const spy = sinon.spy(component.boxjs.webView, 'insert');
        const $component = attach2Document(component);
        component.args = {};
        component.data.set('src', 'https://www.baidu.com');
        component.communicator.fireMessage({
            type: 'slaveUpdated'
        });
        component.nextTick(() => {
            expect(spy.callCount).toBe(2);
            component.dispose();
            done();
        });
    });
});
