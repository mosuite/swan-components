/**
 * @file button 组件单测
 * @author yangzongjun@baidu.com
 */

import sinon from 'sinon';
import video from '../../../src/video/index';
import button from '../../../src/button/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import Communicator from '../../mock/communicator';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
const COMPONENT_NAME = 'button';

function getTestView(initData) {
    const componentVideo = getComponentClass('video', video);
    const componentButton = getComponentClass(
        'button',
        button,
        {
            data: {...initData}
        }
    );

    const factory = getFactory();
    const properties = {
        classProperties: {
            components: {
                button: componentButton,
                video: componentVideo
            }
        }
    };
    factory.componentDefine(
        'testComponent', {
            template: `
                <swan-page>
                    <video src="https://vd3.bdstatic.com/mda-ia8e6q3g23py8qdh/hd/mda-ia8e6q3g23py8qdh.mp4?playlist=%5B%22hd%22%5D&auth_key=1521549485-0-0-d5d042ba3555b2d23909d16a82916ebc&bcevod_channel=searchbox_feed&pd=share">
                        <button s-ref="button" size="{{size}}" open-type="getPhoneNumber">
                            na button
                        </button>
                    </video>
                </swan-page>`,
            initData() {
                return {
                    size: 'default'
                };
            }
        },
        properties
    );
    return new (factory.getComponents('testComponent'))();
}

describe('component [' + COMPONENT_NAME + ']', () => {
    describe('h5 button', () => {
        let component = null;
        let $component = null;
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, button);
            $component = attach2Document(component);
        });
        afterEach(() => {
            component.dispose();
        });

        it('should be render while attach', () => {
            let $swanButton = $component.querySelector('swan-button');
            expect($swanButton).not.toBe(null);
        });

        it('should has one default slot', () => {
            expect(component.slot.length).toBe(1);
        });

        it('should be getuserinfo while set attribute openType: getUserInfo', done => {
            let component = buildComponent(COMPONENT_NAME, button);
            attach2Document(component);
            component.data.set('openType', 'getUserInfo');
            let swan = component.swan;
            let spy = sinon.spy(component.boxjs.data, 'get');
            component.nextTick(() => {
                component.fire('bindtap', {});
                expect(spy.calledWith(sinon.match.has('name', 'swan-userInfo'))).toBe(true);
                spy.restore();
                component.dispose();
                done();
            });
        });
        it('should be getPhoneNumber while set attribute openType: getPhoneNumber', done => {
            component.data.set('openType', 'getPhoneNumber');
            let spy = sinon.spy(component.boxjs.data, 'get');
            component.nextTick(() => {
                component.fire('bindtap', {});
                expect(spy.calledWith(sinon.match.has('name', 'swan-phoneNumber'))).toBe(true);
                spy.restore();
                done();
            });
        });

        it('should be getOpenSetting while set attribute openType: openSetting', done => {
            component.data.set('openType', 'openSetting');
            let spy = sinon.spy(component.boxjs.ui, 'open');
            component.nextTick(() => {
                component.fire('bindtap', {});
                expect(spy.calledWith(sinon.match.has('name', 'swan-setting'))).toBe(true);
                spy.restore();
                done();
            });
        });
        it('should be share while set attribute openType', done => {
            component.data.set('openType', 'share');
            const spy = sinon.spy(component, 'dispatch');
            component.nextTick(() => {
                component.fire('bindtap', {});
                expect(spy.calledWith(
                    'abilityMessage',
                    sinon.match
                        .has('eventType', 'share')
                    )).toBe(true);
                spy.restore();
                done();
            });
        });
        it('should be bindcontact while set attribute openType: contact', done => {
            component.data.set('openType', 'contact');
            let spy = sinon.spy(component.boxjs.ui, 'open');
            component.nextTick(() => {
                component.fire('bindtap', {});
                expect(spy.calledWith(sinon.match.has('name', 'swan-IM'))).toBe(true);
                spy.restore();
                done();
            });
        });
        it('should not call dispatch while set attribute disabled', done => {
            const spy = sinon.spy(component, 'dispatch');
            component.data.set('disabled', true);
            component.nextTick(() => {
                component.fire('bindtap', {});
                expect(spy.callCount).toBe(0);
                done();
            });
        });
        it('should listen LabelFirstTapped message from communicator', () => {
            component.data.set('openType', 'getUserInfo');
            const spy = sinon.spy(component.boxjs.data, 'get');
            Communicator.getInstance().fireMessage({
                type: 'LabelFirstTapped',
                data: {
                    target: component.uid
                }
            });
            expect(spy.callCount).toBe(1);
            spy.restore();
        });
        it('should listen LabelTapped message from communicator', () => {
            component.data.set('openType', 'getUserInfo');
            const spy = sinon.spy(component.boxjs.data, 'get');
            Communicator.getInstance().fireMessage({
                type: 'LabelTapped',
                data: {
                    target: component.uid
                }
            });
            expect(spy.callCount).toBe(1);
            spy.restore();
        });

        describe('check touch events', () => {
            let component = buildComponent(COMPONENT_NAME, button);
            let $component = attach2Document(component);
            let $swanButton = $component.querySelector('swan-button');


            function createTouchEvent(type, touchInits, target) {
                const event = new TouchEvent(
                    type,
                    {
                        changedTouches: [
                            new Touch({
                                identifier: 10001,
                                target: target,
                                ...touchInits
                            }),
                            new Touch({
                                identifier: 10002,
                                target: target,
                                ...touchInits
                            })
                        ],
                        targetTouches: [
                            new Touch({
                                identifier: 10001,
                                target: target,
                                ...touchInits
                            })
                        ],
                        bubbles: true
                    }
                );
                return event;
            }
        });
    });

    describe('h5 button api test', () => {
        // getUserInfo
        it('should be getUserInfo fail while api catch', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'getUserInfo',
                        unitTestParams: {
                            apiExecResult: 'fail'
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.data, 'get');
            let spy2 = sinon.spy(component, 'dispatchEvent');

            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-userInfo'))).toBe(true);
                    expect(
                        spy.calledWith(
                            component,
                            'bindgetuserinfo',
                            sinon.match
                                .has('detail')
                                .and(
                                    sinon.match.has('erMsg', 'getUserInfo:fail auth deny')
                                )
                        )
                    );

                    spy2.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // getPhoneNumber
        it('should be getPhoneNumber fail while api catch', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'getPhoneNumber',
                        unitTestParams: {
                            apiExecResult: 'fail'
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.data, 'get');
            let spy2 = sinon.spy(component, 'dispatchEvent');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-phoneNumber'))).toBe(true);
                    expect(
                        spy.calledWith(
                            component,
                            'bindgetphonenumber',
                            sinon.match
                                .has('detail')
                                .and(
                                    sinon.match.has('erMsg', 'getPhoneNumber:fail auth deny')
                                )
                        )
                    );

                    spy2.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // openSetting api catch
        it('should be openSetting fail while api catch', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'openSetting',
                        unitTestParams: {
                            apiExecResult: 'fail'
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            let spy2 = sinon.spy(component, 'dispatchEvent');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-setting'))).toBe(true);
                    expect(
                        spy.calledWith(
                            component,
                            'bindopenSetting',
                            sinon.match
                                .has('detail')
                                .and(
                                    sinon.match.has('erMsg', 'getOpensetting:fail auth deny')
                                )
                        )
                    );

                    spy2.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // openSetting data is null
        it('should be openSetting fail while data is null', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'openSetting',
                        unitTestParams: {
                            apiExecResult: 'dataEmpty'
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            let spy2 = sinon.spy(component, 'dispatchEvent');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-setting'))).toBe(true);
                    expect(
                        spy.calledWith(
                            component,
                            'bindopenSetting',
                            sinon.match
                                .has('detail')
                                .and(
                                    sinon.match.has('erMsg', 'getOpensetting:fail auth deny')
                                )
                        )
                    );

                    spy2.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // bindcontact
        it('should be bindcontact fail while data is null', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'contact',
                        unitTestParams: {
                            apiExecResult: 'dataEmpty'
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            let spy2 = sinon.spy(component, 'dispatchEvent');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-IM'))).toBe(true);
                    expect(
                        spy.calledWith(
                            component,
                            'bindcontact',
                            sinon.match
                                .has('detail')
                                .and(
                                    sinon.match.has('erMsg', 'enterContact:fail not support')
                                )
                        )
                    );

                    spy2.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });
    });

    describe('h5 button launchApp', () => {

        // launchAppInfo
        it('should be launchAppInfo fail while data is null', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'launchApp',
                        unitTestParams: {
                            callbackData: {
                                status: 0,
                                message: '调起成功',
                                data: {
                                    data: {
                                        canOpenApp: true,
                                        isNeedDownload: true
                                    }
                                }
                            }
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.data, 'get');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-launchAppInfo'))).toBe(true);

                    spy.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // launchAppInfo request data failed
        it('should be launchAppInfo fail while request data failed', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'launchApp',
                        unitTestParams: {
                            apiExecResult: 'fail',
                            callbackData: {
                                status: 0,
                                message: '调起成功',
                                data: null
                            }
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.data, 'get');
            let spy2 = sinon.spy(component, 'dispatchEvent');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-launchAppInfo'))).toBe(true);
                    expect(spy2.callCount).toBe(1);

                    spy.restore();
                    spy2.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // launchAppInfo request data success but can't open app
        it('should be launchAppInfo fail while request data success but cannot open app', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'launchApp',
                        unitTestParams: {
                            isAndroid: true,
                            callbackData: {
                                status: 0,
                                message: '调起成功',
                                data: {
                                    canOpenApp: false,
                                    isNeedDownload: true
                                }
                            }
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.data, 'get');
            let spy2 = sinon.spy(component, 'dispatchEvent');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.calledWith(sinon.match.has('name', 'swan-launchAppInfo'))).toBe(true);
                    expect(spy2.callCount).toBe(1);

                    spy.restore();
                    spy2.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // launchAppInfo android 调用isAppInstalled判断是否安装app失败，直接走下载
        it('should be launchAppInfo fail while isAppInstalled failed', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'launchApp',
                        unitTestParams: {
                            isAndroid: true,
                            callbackData: {
                                status: 0,
                                message: '调起成功',
                                data: {
                                    data: {
                                        canOpenApp: true,
                                        isNeedDownload: true
                                    }
                                }
                            },
                            isAppInstalledApiExecResult: 'fail'
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.callCount).toBe(1);

                    spy.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // launchAppInfo android 没安装app直接走下载
        it('should be launchAppInfo fail while android no app', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'launchApp',
                        unitTestParams: {
                            isAndroid: true,
                            callbackData: {
                                status: 0,
                                message: '调起成功',
                                data: {
                                    data: {
                                        canOpenApp: true,
                                        isNeedDownload: true
                                    }
                                }
                            },
                            isAppInstalledCallbackData: {
                                hasApp: false
                            }
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.callCount).toBe(1);

                    spy.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });

        // launchAppInfo android 安装app打开
        it('should be launchAppInfo fail while android app installed', done => {
            let component = buildComponent(
                COMPONENT_NAME,
                button,
                {
                    data: {
                        openType: 'launchApp',
                        unitTestParams: {
                            isAndroid: true,
                            callbackData: {
                                status: 0,
                                message: '调起成功',
                                data: {
                                    data: {
                                        canOpenApp: true,
                                        isNeedDownload: true
                                    }
                                }
                            },
                            isAppInstalledCallbackData: {
                                hasApp: true
                            }
                        }
                    }
                }
            );
            attach2Document(component);

            let spy = sinon.spy(component.boxjs.ui, 'open');
            component.fire('bindtap', {});
            component.nextTick(() => {
                setTimeout(() => {
                    expect(spy.callCount).toBe(1);

                    spy.restore();
                    component.dispose();
                    done();
                }, 50); // 端能力调用callback有延迟
            });
        });
    });

    describe('na button', () => {
        describe('base feature', () => {
            let component = getTestView();
            component.attach(document.body);
            let buttonInstance = component.ref('button');
            it('should update while style change', done => {
                const spy = sinon.spy(buttonInstance.boxjs.ui, 'update');
                buttonInstance.data.set('size', 'mini');
                // test中通过data.set改变字段不会自动触发 slaveUpdated ，需要手动触发
                buttonInstance.communicator.fireMessage({
                    type: 'slaveUpdated'
                });
                buttonInstance.nextTick(() => {
                    expect(spy.callCount).toBe(0);
                    spy.restore();
                    done();
                });
            });

            it('should call remove while detached', done => {
                const spy = sinon.spy(buttonInstance.boxjs.ui, 'close');
                component.dispose();
                buttonInstance.nextTick(() => {
                    expect(spy.callCount).toBe(1);

                    spy.restore();
                    done();
                });
            });
        });

        describe('na button api fail', () => {
            describe('insert fail', () => {
                let component = getTestView({
                    unitTestParams: {
                        apiExecResult: ['insertFail']
                    }
                });
                component.attach(document.body);
                let buttonInstance = component.ref('button');

                it('should insert fail', done => {
                    setTimeout(() => {
                        expect(buttonInstance.isInserted).toBe(false);
                        buttonInstance.dispose();
                        done();
                    }, 100);
                });
            });
            // insert失败，在update。最终insert 2次
            describe('insert fail', () => {
                let component = getTestView({
                    unitTestParams: {
                        apiExecResult: ['insertFail', 'updateFail']
                    }
                });
                component.attach(document.body);
                let buttonInstance = component.ref('button');
                const spy = sinon.spy(buttonInstance.boxjs.ui, 'open');

                it('should insert fail', done => {
                    buttonInstance.data.set('size', 'mini');
                    // test中通过data.set改变字段不会自动触发 slaveUpdated ，需要手动触发
                    buttonInstance.communicator.fireMessage({
                        type: 'slaveUpdated'
                    });
                    setTimeout(() => {
                        expect(spy.callCount >= 2).toBe(true);
                        buttonInstance.dispose();
                        done();
                    }, 100);
                });
            });

            // update失败
            describe('update fail', () => {
                let component = getTestView({
                    unitTestParams: {
                        apiExecResult: ['updateFail']
                    }
                });
                component.attach(document.body);
                let buttonInstance = component.ref('button');
                it('should update fail', done => {
                    const oldArgs = buttonInstance.args;
                    buttonInstance.data.set('hidden', true);
                    // test中通过data.set改变字段不会自动触发 slaveUpdated ，需要手动触发
                    buttonInstance.communicator.fireMessage({
                        type: 'slaveUpdated'
                    });
                    setTimeout(() => {
                        expect(JSON.stringify(buttonInstance.args))
                            .toBe(JSON.stringify(oldArgs));
                        buttonInstance.dispose();
                        done();
                    }, 100);
                });
            });

            // remove失败
            describe('remove fail', () => {
                let component = getTestView({
                    unitTestParams: {
                        apiExecResult: ['removeFail']
                    }
                });
                component.attach(document.body);
                let buttonInstance = component.ref('button');
                it('should remove fail', done => {
                    const spy = sinon.spy(buttonInstance.boxjs.ui, 'close');
                    component.dispose();
                    buttonInstance.nextTick(() => {
                        expect(spy.callCount).toBe(1);
                        expect(buttonInstance.isInserted).toBe(true);

                        spy.restore();
                        done();
                    });
                });
            });

        });

        describe('touch events', () => {
            let component = getTestView();
            component.attach(document.body);
            let buttonInstance = component.ref('button');
            it('should have hoverClass while tap', done => {
                const spy = sinon.spy(buttonInstance.boxjs.ui, 'update');

                buttonInstance.communicator.fireMessage({
                    type: `button_${buttonInstance.data.get('id')}`,
                    params: {
                        action: 'touchstart',
                        e: {
                            changedTouches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ],
                            touches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ]
                        }
                    }
                });
                buttonInstance.communicator.fireMessage({
                    type: `button_${buttonInstance.data.get('id')}`,
                    params: {
                        action: 'touchmove',
                        e: {
                            changedTouches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ],
                            touches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ]
                        }
                    }
                });
                buttonInstance.communicator.fireMessage({
                    type: `button_${buttonInstance.data.get('id')}`,
                    params: {
                        action: 'touchend',
                        e: {
                            changedTouches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ],
                            touches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ]
                        }
                    }
                });

                setTimeout(() => {
                    buttonInstance.nextTick(() => {
                        expect(spy.callCount).toBe(1);
                        expect(buttonInstance.el.classList.contains(buttonInstance.data.get('hoverClass'))).toBe(true);
                        spy.restore();
                        done();
                    });
                }, +buttonInstance.data.get('hoverStartTime'));
            });
            it('should not have hoverClass while move', done => {
                const spy = sinon.spy(buttonInstance.boxjs.ui, 'update');

                buttonInstance.communicator.fireMessage({
                    type: `button_${buttonInstance.data.get('id')}`,
                    params: {
                        action: 'touchstart',
                        e: {
                            changedTouches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ],
                            touches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ]
                        }
                    }
                });
                buttonInstance.communicator.fireMessage({
                    type: `button_${buttonInstance.data.get('id')}`,
                    params: {
                        action: 'touchmove',
                        e: {
                            changedTouches: [
                                {
                                    clientX: 11,
                                    clientY: 11
                                }
                            ],
                            touches: [
                                {
                                    clientX: 11,
                                    clientY: 11
                                }
                            ]
                        }
                    }
                });
                buttonInstance.communicator.fireMessage({
                    type: `button_${buttonInstance.data.get('id')}`,
                    params: {
                        action: 'touchend',
                        e: {
                            changedTouches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ],
                            touches: [
                                {
                                    clientX: 10,
                                    clientY: 10
                                }
                            ]
                        }
                    }
                });
                setTimeout(() => {
                    buttonInstance.nextTick(() => {
                        expect(spy.callCount).toBe(0);
                        spy.restore();
                        done();
                    });
                }, +buttonInstance.data.get('hoverStartTime'));
            });
        });
    });
});
