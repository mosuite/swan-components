import image from '../../../src/image/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import {loadEventCallbackFieldCheck} from '../../utils/event-callback-field-check';
import Communicator from '../../mock/communicator';
import sinon from 'sinon';
const COMPONENT_NAME = 'image';

describe('component [' + COMPONENT_NAME + ']', () => {
    global.pageInfo = {appPath: '', pagePath: '', path: ''};
    let component = buildComponent(COMPONENT_NAME, image, {
        data: {
            // src: 'https://pic.92to.com/360/201604/02/7663860_201111241009130843.jpg',
            src: 'https://www.baidu.com/favicon.ico',
            mode: 'widthFix',
            lazyLoad: true
        }
    });
    let $component = attach2Document(component);

    componentBaseFieldCheck(COMPONENT_NAME, component);
    describe('base feature', () => {
        it('should be render while attach', () => {
            component.data.set('mode', 'top');
            let $swanImage = $component.querySelector('swan-image>div');
            expect($swanImage).not.toBe(null);
        });
    });
    describe('events and message', () => {
        it('should not dispatch bindload since img had loaded while listen componentScroll message from communicator', done => {
            let spy = sinon.spy(component, 'dispatchEvent');
            Communicator.getInstance().fireMessage({
                type: 'componentScroll'
            });
            expect(spy.callCount).toBe(0);
            spy.restore();
            done();
        });

        it('should trigger bindload while loaded', done => {
            const component = buildComponent(COMPONENT_NAME, image,{
                data:{
                    src:'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
                    mode: 'widthFix'
                }
            });

            component.on('bindload', e => {
                loadEventCallbackFieldCheck(expect, done, e);
            });
            attach2Document(component);
        })

        it('should trigger binderror while error', done => {
            const componet2 = buildComponent(COMPONENT_NAME, image, {
                data: {
                    src:'https://smartapp.baidu.com/docs/img/logo1111.png',
                }
            });
            componet2.on('binderror', e => {
                loadEventCallbackFieldCheck(expect, done, e);
            });
            attach2Document(componet2);
        })
    });

    describe('image load', () => {
        beforeEach(() => {
            component = buildComponent(COMPONENT_NAME, image);
            attach2Document(component);
        });
        afterEach(() => {
            component.dispose();
        });

        it('image type: data:image, should dispatch bindload', done => {
            let spy = sinon.spy(component, 'dispatchEvent');
            component.data.set('src', 'data:image/xxx');
            component.nextTick(() => {
                expect(spy.calledOnceWith('bindload'));
                spy.restore();
                done();
            });
        });

        it('image type: data:image, should dispatch bindload', done => {
            let spy = sinon.spy(component, 'dispatchEvent');
            component.data.set('src', 'data:image/xxx');
            component.nextTick(() => {
                expect(spy.calledOnceWith('bindload'));
                spy.restore();
                done();
            });
        });

        it('image type: bdfile://, should dispatch bindload', done => {
            let spy = sinon.spy(component, 'dispatchEvent');

            component.data.set('src', 'bdfile://xxx');

            component.nextTick(() => {
                expect(spy.calledOnceWith('bindload'));
                spy.restore();
                done();
            });
        });

        it('should not dispatch bindload when src of img is null', done => {
            let spy = sinon.spy(component, 'dispatchEvent');
            component.data.set('src', '');
            component.nextTick(() => {
                expect(spy.calledOnceWith('bindload'));
                spy.restore();
                done();
            });
        });
    });
    describe('image apiFail: dataFail', () => {
        let component = buildComponent(COMPONENT_NAME, image, {
            data: {
                apiExecResult: 'dataFail',
                src: 'https://www.baidu.com/favicon.ico',
                mode: 'widthFix',
                lazyLoad: true
            }
        });
        attach2Document(component);
        component.data.set('src', 'bdfile://xxx');
        component.data.set('mode', 'heightFix');
        it('should catch', done => {
            const spy = sinon.spy(component.boxjs.data, 'get');
            component.nextTick(() => {
                //expect(spy.calledWith(sinon.match.has('name', sinon.match('swan-localImgData')))).toBe(true);
                spy.restore();
                done();
            });
        })
    });
});
