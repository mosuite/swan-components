import CoverImage from '../../../src/cover-image/index';
import sinon from 'sinon';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import {tapEventCallbackFieldCheck} from '../../utils/event-callback-field-check';
import attach2Document from '../../utils/attach-to-document';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';

const COMPONENT_NAME = 'cover-image';
const URL_SMARTAPP_LOGO = 'http://smartapp.baidu.com/docs/img/logo.png';
const URL_BAIDU_LOGO = 'http://www.baidu.com/img/bd_logo1.png?where=super';

function preLoadImg(src) {
    return new Promise((resolve, reject) => {
        const imgEntity = new Image();
        imgEntity.onerror = e => {
            reject();
        };
        imgEntity.onload = e => {
            resolve(e);
        };
        setTimeout(() => {
            imgEntity.src = src;
        }, 200);
    });
}

/**
 * 创建单测用例
 * @param {Object} attrs 组件的自定义属性键值对
 * @param {Object} methods 组件的自定义方法
 * @param {boolean} dispose 是否自动销毁组件
 * @return {Promise} promise 对象
 */
const getTestCase = ({
    attrs = {
        src: URL_BAIDU_LOGO,
        hidden: false
    },
    methods = {},
    dispose = false
}) => {
    return new Promise((resolve, reject) => {
        const attrsArray = [];
        Object.keys(attrs).map(key => attrsArray.push(`${key}="${attrs[key]}"`));
        const factory = getFactory();
        const componentCoverImage = getComponentClass(COMPONENT_NAME, CoverImage);
        factory.componentDefine(
            'testComponent', {
                template: `<view>
                    <cover-image s-ref="coverimage" ${attrsArray.join(' ')}></cover-image>
                </view>`,
                ...methods
            }, {
                classProperties: {
                    components: {
                        'cover-image': componentCoverImage
                    }
                }
            }
        );
        const TestView = factory.getComponents('testComponent');
        const testComponent = new TestView();
        testComponent.attach(document.body);
        testComponent.nextTick(() => {
            const coverimage = testComponent.ref('coverimage');
            preLoadImg(attrs.src).then(() => {
                testComponent.nextTick(() => {
                    resolve({
                        coverimage,
                        testComponent
                    });
                    dispose && testComponent.dispose();
                });
            });
        });
    });
};
describe('component [' + COMPONENT_NAME + ']', () => {
    it('should be render while attach', done => {
        getTestCase({
            dispose: false
        }).then(({coverimage, testComponent}) => {
            const $swanCoverImage = coverimage.el;
            const $innerDiv = coverimage.el.querySelector('swan-cover-image>div');
            expect($swanCoverImage).not.toBe(null);
            expect($swanCoverImage.getAttribute('id')).not.toBe(null);
            expect($innerDiv).not.toBe(null);
            done();
            testComponent.dispose();
        });
    });

    it('should remove native component while detached', done => {
        getTestCase({
            dispose: false
        }).then(({coverimage, testComponent}) => {
            coverimage.dispose();
            expect(coverimage.isInserted).toBe(false);
            done();
            testComponent.dispose();
        });
    });

    it('should be invisible while hidden', done => {
        getTestCase({
            attrs: {
                src: URL_SMARTAPP_LOGO,
                hidden: 'true'
            },
            dispose: false
        }).then(({coverimage, testComponent}) => {
            const $swanCoverImage = coverimage.el;
            expect($swanCoverImage.getAttribute('hidden')).toBe('true');
            expect(getComputedStyle($swanCoverImage).display).toBe('none');
            done();
            testComponent.dispose();
        });
    });

    it('should handle tap event', done => {
        getTestCase({
            attrs: {
                'bindtap': "test('bindtap', $event, '', '', '')",
                'src': URL_SMARTAPP_LOGO
            },
            methods: {
                test(e, $event) {
                    tapEventCallbackFieldCheck(expect, done, $event);
                    done();
                }
            }
        }).then(({coverimage}) => {
            coverimage.communicator.fireMessage({
                type: `coverImage_${coverimage.data.get('id')}`,
                params: {
                    action: 'touchstart',
                    e: {
                        touches: [{x: 176, y: 577, clientX: 176, clientY: 577, pageX: 176, pageY: 577, identifier: 0}],
                        changedTouches: [{x: 176, y: 577, clientX: 176, clientY: 577, pageX: 176, pageY: 577, identifier: 0}]
                    }
                }
            });
            coverimage.communicator.fireMessage({
                type: `coverImage_${coverimage.data.get('id')}`,
                params: {
                    action: 'tap',
                    e: {
                        touches: [{x: 176, y: 577, clientX: 176, clientY: 577, pageX: 176, pageY: 577, identifier: 0}],
                        changedTouches: [{x: 176, y: 577, clientX: 176, clientY: 577, pageX: 176, pageY: 577, identifier: 0}]
                    }
                }
            });
            done();
        });
    });

    it('should update native component while fullscreenchange and slaveUpdated', done => {
        getTestCase({
            attrs: {
                src: URL_SMARTAPP_LOGO
            },
            dispose: false
        }).then(({coverimage, testComponent}) => {
            const $swanCoverImage = coverimage.el;
            const spy = sinon.spy(coverimage.boxjs.cover, 'update');
            coverimage.data.set('style', 'background: rgba(0, 0, 0, .5)');
            coverimage.nextTick(() => {
                coverimage.communicator.fireMessage({
                    type: 'fullscreenchange'
                });
                preLoadImg(URL_SMARTAPP_LOGO).then(() => {
                    coverimage.nextTick(() => {
                        expect(spy.callCount).toBe(1);
                        done();
                        testComponent.dispose();
                    });
                });
            });
        });
    });

    it('should watch props src&hidden', done => {
        getTestCase({
            attrs: {
                src: URL_SMARTAPP_LOGO
            },
            dispose: false
        }).then(({coverimage, testComponent}) => {
            const spy = sinon.spy(coverimage.boxjs.cover, 'update');
            coverimage.data.set('src', URL_BAIDU_LOGO);
            coverimage.nextTick(() => {
                coverimage.communicator.fireMessage({
                    type: 'slaveUpdated'
                });
                preLoadImg(URL_SMARTAPP_LOGO).then(() => {
                    coverimage.nextTick(() => {
                        expect(spy.callCount).toBe(1);
                        testComponent.dispose();
                        done();
                    });
                });
            });
        });
    });
});
describe('coverImage Fail: insertFail', () => {
    const component = buildComponent(
        COMPONENT_NAME,
        CoverImage,
        {
            data: {
                unitTestParams: {
                    apiExecResult: 'insertFail'
                }
            }
        }
    );
    attach2Document(component);
    const spy = sinon.spy(component.boxjs.cover, 'insert');
    it('should catch', done => {
        setTimeout(() => {
            expect(component.isInserted).toBe(false);
            spy.restore();
            component.dispose();
            done();
        }, 500);
    });
});
describe('coverImage Fail: updateFail', () => {
    const component = buildComponent(
        COMPONENT_NAME,
        CoverImage,
        {
            data: {
                unitTestParams: {
                     apiExecResult: 'updateFail'
                }
            }
        }
    );
    attach2Document(component);
    const spy = sinon.spy(component.boxjs.cover, 'update');
    it('should catch', done => {
        setTimeout(() => {
            component.communicator.fireMessage({
                type: 'slaveUpdated'
            });
            expect(component.isInserted).toBe(true);
            expect(spy.calledOnceWith(sinon.match.has('type', sinon.match('update')))).toBe(false);
            spy.restore();
            component.dispose();
            done();
        }, 500);
    });
});
describe('coverImage Fail: removeFail', () => {
    const component = buildComponent(
        COMPONENT_NAME,
        CoverImage,
        {
            data: {
                unitTestParams: {
                    apiExecResult: 'removeFail'
                }
            }
        }
    );
    attach2Document(component);
    const spy = sinon.spy(component.boxjs.cover, 'remove');
    it('should catch', done => {
        setTimeout(() => {
            expect(spy.calledOnceWith(sinon.match.has('type', sinon.match('remove')))).toBe(false);
            expect(component.isInserted).toBe(true);
            spy.restore();
            component.dispose();
            done();
        }, 500);
    });
});


