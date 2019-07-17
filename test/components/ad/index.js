import sinon from 'sinon';
import ad from '../../../src/ad/index';
import buildComponent from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
const COMPONENT_NAME = 'ad';

// 检测组件是否触发adRender以及adRender中bindrender和bindboxjssuccess是否被正确执行
// 比较两个组件执行adRender的执行顺序

describe('component [' + COMPONENT_NAME + ']', () => {

    describe('base feature', () => {
        const component = buildComponent(COMPONENT_NAME, ad, {});
        const component2 = buildComponent(COMPONENT_NAME, ad, {});

        const spy = sinon.spy(component, 'attached');
        const spy2 = sinon.spy(component2, 'attached');

        const callback = sinon.spy();
        const callback2 = sinon.spy();
        const callback3 = sinon.spy();
        const callback4 = sinon.spy();

        component.on('bindrender', callback);
        component.on('bindboxjssuccess', callback2);
        component2.on('bindrender', callback3);
        component2.on('bindboxjssuccess', callback4);

        const $component = attach2Document(component);
        const $component2 = attach2Document(component2);
        componentBaseFieldCheck(COMPONENT_NAME, component);
        componentBaseFieldCheck(COMPONENT_NAME, component2);

        afterAll(() => {
            component.dispose();
            component2.dispose();
            spy.restore();
            spy2.restore();
        });

        it('should do attached', () => {
            expect(spy.callCount).toBe(1);
            expect(spy2.callCount).toBe(1);

        });

        it('should be render after attached', () => {
            let $swanAd = $component.querySelector('swan-ad');
            let $swanAd2 = $component2.querySelector('swan-ad');

            expect($swanAd).not.toBe(null);
            expect($swanAd2).not.toBe(null);

            let $innerDiv = $component.querySelector('swan-ad div');
            let $innerDiv2 = $component2.querySelector('swan-ad div');

            expect($innerDiv).not.toBe(null);
            expect($innerDiv2).not.toBe(null);
        });

        it('should do after another', function () {
            expect(callback.calledBefore(callback3)).toBe(true);
            expect(callback2.calledBefore(callback4)).toBe(true);
        });

        it('should fire bindrender event', () => {
            expect(callback.callCount).toBe(1);
            expect(callback.calledOnce).toBe(true);
            expect(callback3.callCount).toBe(1);
            expect(callback3.calledOnce).toBe(true);
        });

        it('should fire bindboxjssuccess event', () => {
            expect(callback2.callCount).toBe(1);
            expect(callback2.calledOnce).toBe(true);
            expect(callback4.callCount).toBe(1);
            expect(callback4.calledOnce).toBe(true);
        });
    });

    describe('events & other feature', () => {
        it('should call adRender', () => {
            window.adRender = () => {};
            const mySpy = sinon.spy(window, 'adRender');
            const component = buildComponent(COMPONENT_NAME, ad, {});
            attach2Document(component);

            component.onCloseTouchMove();
            component.onTap();

            expect(mySpy.callCount).toBe(1);
            mySpy.restore();
            component.dispose();
        });

        it('should send request', () => {
            const component = buildComponent(COMPONENT_NAME, ad, {
                data: {
                    backend: 'zhidao'
                }
            });
            const mySpy = sinon.spy(component.swan, 'request');
            attach2Document(component);

            expect(mySpy.callCount >= 1).toBe(true);
            mySpy.restore();
            component.dispose();
        });
    });
});
