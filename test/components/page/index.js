import page from '../../../src/page';
import Button from '../../../src/button/index';
import superCustomComponent from '../../../src/super-custom-component';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';

import sinon from 'sinon';
const COMPONENT_NAME = 'page';

const componentButton = getComponentClass('button', Button);
const componentPage = getComponentClass('page', page);

const factory = getFactory();
const properties = {
    classProperties: {
        components: {
            button: componentButton,
            page: componentPage
        }
    }
};

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, page);
        const $component = attach2Document(component);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        it('should be rendered after attach', () => {
            expect($component).not.toBe(null);
            component.dispose();
        });

        it('should return while get slaveId failed', () => {
            try {
                buildComponent(
                    COMPONENT_NAME,
                    page,
                    {
                        data: {
                            unitTestParams: {
                                apiExecResult: 'rej'
                            }
                        }
                    }
                );
            } catch (err) {
                let errStr = err + '';
                expect(errStr.indexOf('Can not get slave id from baiduapp.')).not.toBe(-1);
            }
        });

        it('should call updated while setData', done => {
            const component = buildComponent(COMPONENT_NAME, page);
            attach2Document(component);
            component.masterNoticeComponents = [1, 2];
            component.data.set('testData', 'hello');
            const spy = sinon.spy(component, 'updated');

            component.nextTick(() => {
                expect(spy.callCount).toBe(1);

                component.dispose();
                spy.restore();
                done();
            });
        });

        it('should attach', done => {
            function getTestView(initData) {
                factory.componentDefine(
                    'testComponent', {
                        template: `
                            <swan-page>
                                <page s-ref="page">
                                    <button s-ref="button" disabled="{{disabled}}" bindtouchstart="bindtouchstart"
                                            bindtouchmove="bindtouchmove"
                                            bindtap="bindtap"
                                            bindlongpress="bindlongpress"
                                        >
                                        na button
                                    </button>
                                </page>
                            </swan-page>`,
                        initData() {
                            return {
                                size: 'default',
                                disabled: true,
                                ...initData
                            };
                        }
                    },
                    properties
                );
                return new (factory.getComponents('testComponent'))();
            }

            let component = getTestView();
            component.attach(document.body);
            let pageInstance = component.ref('page');
            let buttonInstance = component.ref('button');

            pageInstance.andrSendFP(-1);
            pageInstance.andrSendFP(1);
            pageInstance.getFPTiming(10);

            let spy = sinon.spy(pageInstance.communicator, 'sendMessage');
            pageInstance.slaveLoaded();
            expect(spy.callCount).toBe(1);
            spy.restore();


            spy = sinon.spy(pageInstance.communicator, 'sendMessage');
            pageInstance.eventHappen('bindtouchmove', {}, function () {}, true, 'catch');
            expect(spy.callCount).toBe(1);
            spy.restore();

            !global.pageInfo && (global.pageInfo = {appPath: ''});
            spy = sinon.spy(pageInstance, 'initPageEnviromentEvent');
            pageInstance.setInitData({value: {a: 1}, appConfig: {window: {onReachBottomDistance: true}}});
            expect(spy.callCount).toBe(1);
            spy.restore();

            spy = sinon.spy(pageInstance, 'sendAbilityMessage');
            pageInstance.communicator.fireMessage({
                type: 'setData',
                setObject: {a: 2}
            });
            pageInstance.communicator.fireMessage({
                type: 'setData',
                setObject: {
                    b: 3,
                    c: null,
                    d: NaN,
                    e: new Date(),
                    f: [1, 2],
                    g: {g1: 1},
                    h: function () {}
                }
            });
            pageInstance.communicator.fireMessage({
                type: 'pushData',
                setObject: {
                    b: 3,
                    c: null,
                    d: NaN,
                    e: new Date(),
                    f: [1, 2],
                    g: {g1: 1}
                }
            });
            component.nextTick(() => {
                expect(spy.callCount >= 3).toBe(true);
                spy.restore();

                component.dispose();
                done();
            });
        });
    });

    describe('performance', () => {
        it('performance not exist', done => {
            let originalPerformance = global.performance;
            delete window.performance;
            const component = buildComponent(COMPONENT_NAME, page,
                {
                    data: {
                        unitTestParams: {
                            isAndroid: true
                        }
                    }
                }
            );
            const spy = sinon.spy(component, 'andrSendFP');
            attach2Document(component);

            expect(spy.withArgs(-1, 'fe_no_performance_api').callCount).toBe(1);
            window.performance = originalPerformance;
            spy.restore();
            component.dispose();
            done();
        });

        it('PerformanceObserver not exist', done => {
            let originalPerformanceObserver = global.PerformanceObserver;
            delete window.PerformanceObserver;
            const component = buildComponent(COMPONENT_NAME, page,
                {
                    data: {
                        unitTestParams: {
                            isAndroid: true
                        }
                    }
                }
            );
            const spy = sinon.spy(component, 'getFPTiming');
            attach2Document(component);

            setTimeout(() => {
                expect(spy.callCount).toBe(1);
                window.PerformanceObserver = originalPerformanceObserver;
                spy.restore();
                component.dispose();
                done();
            }, 3500); // 源码中延迟了 2900
        });

        it('new global.PerformanceObserver error', done => {
            let originalPerformanceObserver = global.PerformanceObserver;
            window.PerformanceObserver = function () {
                return [];
            };
            const component = buildComponent(COMPONENT_NAME, page,
                {
                    data: {
                        unitTestParams: {
                            isAndroid: true
                        }
                    }
                }
            );
            const spy = sinon.spy(component, 'getFPTiming');
            attach2Document(component);

            component.nextTick(() => {
                expect(spy.callCount).toBe(1);
                window.PerformanceObserver = originalPerformanceObserver;

                spy.restore();
                component.dispose();
                done();
            });
        });

        it('new global.PerformanceObserver ok: fcp.length >= 1', done => {
            let originalPerformanceObserver = global.PerformanceObserver;
            window.PerformanceObserver = function (callback) {
                return callback({
                    getEntries() {
                        return [
                            {
                                name: 'first-contentful-paint'
                            }
                        ];
                    }
                });
            };

            const component = buildComponent(COMPONENT_NAME, page,
                {
                    data: {
                        unitTestParams: {
                            isAndroid: true
                        }
                    }
                }
            );
            const spy = sinon.spy(component, 'andrSendFP');
            attach2Document(component);

            component.nextTick(() => {
                expect(spy.callCount).toBe(1);
                window.PerformanceObserver = originalPerformanceObserver;

                spy.restore();
                component.dispose();
                done();
            });
        });

        it('new global.PerformanceObserver ok: fcp.length < 1', done => {
            let originalPerformanceObserver = global.PerformanceObserver;
            window.PerformanceObserver = function (callback) {
                return callback({
                    getEntries() {
                        return [];
                    }
                });
            };
            let originFackFunc = window.performance.getEntriesByType;
            window.performance.getEntriesByType = () => [{
                name: 'unknown'
            }];
            const component = buildComponent(COMPONENT_NAME, page,
                {
                    data: {
                        unitTestParams: {
                            isAndroid: true
                        }
                    }
                }
            );
            const spy = sinon.spy(component, 'getFPTiming');
            attach2Document(component);

            component.nextTick(() => {
                expect(spy.callCount).toBe(1);
                window.PerformanceObserver = originalPerformanceObserver;
                window.performance.getEntriesByType = originFackFunc;

                spy.restore();
                component.dispose();
                done();
            });
        });

        it('new global.PerformanceObserver ok: fcp.length < 1', done => {
            let originalPerformanceObserver = global.PerformanceObserver;
            window.PerformanceObserver = function (callback) {
                return callback({
                    getEntries() {
                        return [];
                    }
                });
            };
            let originFackFunc = window.performance.getEntriesByType;
            window.performance.getEntriesByType = () => [];
            const component = buildComponent(COMPONENT_NAME, page,
                {
                    data: {
                        unitTestParams: {
                            isAndroid: true
                        }
                    }
                }
            );
            const spy = sinon.spy(component, 'getFPTiming');
            attach2Document(component);

            component.nextTick(() => {
                expect(spy.callCount).toBe(1);
                window.PerformanceObserver = originalPerformanceObserver;
                window.performance.getEntriesByType = originFackFunc;

                spy.restore();
                component.dispose();
                done();
            });
        });
    });

    describe('messages', () => {
        describe('abilityMessage', () => {
            let testComponent;
            page.template = `<page>
                                <slot></slot>
                            </page>`;
            const componentButton = getComponentClass('button', Button);
            const componentPage = getComponentClass('page', page);

            const factory = getFactory();
            const properties = {
                classProperties: {
                    components: {
                        button: componentButton,
                        page: componentPage
                    }
                }
            };

            factory.componentDefine(
                'test-component', {
                    template: `
                        <swan-page>
                            <page s-ref="page">
                                <button open-type="share" s-ref="button">
                                    button
                                </button>
                            </page>
                        </swan-page>`,
                    initData() {
                        return {
                            size: 'default',
                            disabled: true
                        };
                    }
                },
                properties
            );
            const TestView = factory.getComponents('test-component');
            testComponent = new TestView();
            testComponent.attach(document.body);
            const pageInstance = testComponent.ref('page');
            const buttonInstance = testComponent.ref('button');
            const spy = sinon.spy(pageInstance, 'sendAbilityMessage');

            it('abilityMessage', done => {
                buttonInstance.fire('bindtap', {});
                expect(spy.withArgs('share').callCount).toBe(1);

                // restore page.template
                page.template = null;
                spy.restore();
                testComponent.dispose();
                done();
            });
        });

        describe('addMasterNoticeComponents', () => {
            let testComponent;
            page.template = `<page>
                                <slot></slot>
                            </page>`;
            const componentPage = getComponentClass('page', page);
            const factory = getFactory();
            factory.componentDefine('custom-component', Object.assign({}, superCustomComponent, {
                template: '<swan-cus-comp><view>aaa</view></swan-cus-comp>',
                componentPath: 'super-custom-component-test',
                componentName: 'super-custom-component-test',
                customComponentCss: ''
            }),
            {
                classProperties: {
                    components: Object.assign({}, factory.getAllComponents())
                }
            });
            const CustomComponent = factory.getComponents('custom-component');

            const properties = {
                classProperties: {
                    components: {
                        'page': componentPage,
                        'swan-cus-comp': CustomComponent
                    }
                }
            };

            factory.componentDefine(
                'test-component', {
                    template: `
                        <swan-page>
                            <page s-ref="page">
                                <swan-cus-comp s-ref="cus"></swan-cus-comp>
                            </page>
                        </swan-page>`,
                    initData() {
                        return {
                            size: 'default',
                            disabled: true
                        };
                    }
                },
                properties
            );
            const TestView = factory.getComponents('test-component');
            testComponent = new TestView();
            testComponent.attach(document.body);
            const pageInstance = testComponent.ref('page');
            const customTemplate = testComponent.ref('cus');

            afterAll(() => {
                testComponent.dispose();
            });

            it('addMasterNoticeComponents', done => {
                expect(pageInstance.masterNoticeComponents != []).toBe(true);

                // restore page.template
                page.template = null;
                done();
            });

            it('customComponentInnerUpdated', done => {
                const spy = sinon.spy(pageInstance, 'updated');
                customTemplate.communicator.fireMessage({
                    type: 'setCustomComponentData',
                    value: {
                        type: {},
                        params: {}
                    },
                    operationSet: [{options: {nodeId: customTemplate.uid}}]
                });

                customTemplate.nextTick(() => {
                    // restore page.template
                    page.template = null;

                    expect(spy.callCount).toBe(1);
                    spy.restore();
                    done();
                });
            });
        });
    });

    describe('should fire message', () => {

        let testComponent;
        let component;
        function getTestView(options = {}) {
            const componentButton = getComponentClass(
                'button',
                Button,
            );
            const componentPage = getComponentClass(
                'page',
                page,
            );

            const factory = getFactory();
            const properties = {
                classProperties: {
                    components: {
                        button: componentButton,
                        page: componentPage
                    }
                }
            };
            factory.componentDefine(
                'testComponent', {
                    template: `
                        <swan-page>
                            <page s-ref="page" id="id">
                                <button s-ref="button" disabled="{{disabled}}" bindtouchstart="bindtouchstart"
                                        bindtouchmove="bindtouchmove"
                                        bindtap="bindtap"
                                        bindlongpress="bindlongpress"
                                    >
                                    na button
                                </button>
                            </page>
                        </swan-page>`,
                    initData() {
                        return {
                            size: 'default',
                            disabled: true
                        };
                    }
                },
                properties
            );
            return new (factory.getComponents('testComponent'))();
        }

        beforeEach(() => {
            testComponent = getTestView();
            testComponent.attach(document.body);
            component = testComponent.ref('page');
        });
        afterEach(() => {
            testComponent.dispose();
        });
        it('querySlaveSelector', () => {
            const spy = sinon.spy(component.communicator, 'sendMessage');
            component.communicator.fireMessage({
                type: 'querySlaveSelector',
                value: {}
            });

            expect(spy.called).toBe(true);
            spy.restore();
        });
        it('abilityMessage', () => {
            const spy = sinon.spy(component.communicator, 'fireMessage');
            component.communicator.fireMessage({
                type: 'abilityMessage',
                value: {
                    type: {},
                    params: {}
                }
            });

            expect(spy.called).toBe(true);
            spy.restore();
        });
        it('scrollViewBackToTop', () => {
            const spy = sinon.spy(component.communicator, 'fireMessage');
            component.communicator.fireMessage({
                type: 'scrollViewBackToTop',
                value: {}
            });

            expect(spy.called).toBe(true);
            spy.restore();
        });

        it('requestComponentObserver remove', done => {
            const spy = sinon.spy(component.communicator, 'fireMessage');
            component.communicator.fireMessage({
                type: 'requestComponentObserver',
                operationType: 'remove',
                value: {
                    slaveId: '',
                    reqId: '',
                    relativeInfo: [{selector: '.a .b'}],
                    options: '',
                    targetSelector: '#id',
                    contextId: '',
                    componentName: 'view'
                }
            });

            expect(spy.called).toBe(true);
            spy.restore();
            done();
        });
    });

    describe('browser patch', () => {
        it('browser patch', done => {
            const component = buildComponent(COMPONENT_NAME, page,
                {
                    data: {
                        unitTestParams: {
                            versionMiner: true
                        }
                    }
                }
            );
            attach2Document(component);

            component.dispose();
            done();
        });
    });
});
