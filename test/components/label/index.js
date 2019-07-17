/**
 * @file label组件单测
 * @author sunbaixin@baidu.com
 */
import sinon from 'sinon';
import labelComponent from '../../../src/label/index';
import checkComponent from '../../../src/checkbox/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import button from '../../../src/button/index';
import label from '../../../src/label/index';
import view from '../../../src/view/index';
import radio from '../../../src/radio/index';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
const COMPONENT_NAME = 'label';

describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, labelComponent);
    const $component = attach2Document(component);
    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        let $swanLabel = $component.querySelector('swan-label');
        expect($swanLabel).not.toBe(null);
    });
    it('should has one default slot', () => {
        expect(component.slot.length).toBe(1);
    });
});

describe('component [' + COMPONENT_NAME + ']', () => {
    const componentLabel = getComponentClass('label', label);
    const componentButton = getComponentClass('button', button);
    const componentView = getComponentClass('view', view);
    const componentRadio = getComponentClass('radio', radio);
    const factory = getFactory();
    const properties = {
        classProperties: {
            components: {
                label: componentLabel,
                button: componentButton,
                view: componentView,
                radio: componentRadio
            }
        }
    };

    describe('have SWAN-BUTTON, SWAN-CHECKBOX, SWAN-RADIO, SWAN-SWITCH in children', () => {

        factory.componentDefine(
            'swan-label',
            {
                template: `
                <swan-page>
                    <label s-ref='label'>
                        <view s-ref="view">
                            <button s-ref='button' />
                        </view>
                        hello
                        <button s-ref='button2' />
                    </label>
                </swan-page>
                `
            },
            properties
        );
        const TestView = factory.getComponents('swan-label');
        const testview = new TestView();
        testview.attach(document.body);
        const labelComp = testview.ref('label');

        it('should fire message LabelFirstTapped on button while click label', done => {

            let spy = sinon.spy(labelComp.communicator, 'fireMessage');
            let click = new Event('click');
            labelComp.el.dispatchEvent(click);

            expect(spy.calledOnceWith(
                sinon.match
                    .has('type', 'LabelFirstTapped')
                    .and(
                        sinon.match.has(
                            'data',
                            sinon.match.has('target', testview.ref('button').el.sanComponent.id)
                                .and(sinon.match.has('event', click)
                        )
                    )
                )
            ));

            spy.restore();
            done();
        });
    });

    describe('disables while have SWAN-BUTTON, SWAN-CHECKBOX, SWAN-RADIO, SWAN-SWITCH in children', () => {

        factory.componentDefine(
            'swan-label',
            {
                template: `
                <swan-page>
                    <label s-ref='label'>
                        <view s-ref="view">
                            <radio s-ref='radio' disabled="{{true}}"/>
                        </view>
                        hello
                    </label>
                </swan-page>
                `
            },
            properties
        );
        const TestView = factory.getComponents('swan-label');
        const testview = new TestView();
        testview.attach(document.body);
        const labelComp = testview.ref('label');
        const radioComp = testview.ref('radio');

        it('should not fire message LabelFirstTapped on radio while click label', done => {
            radioComp.el.disabled = true;
            let spy = sinon.spy(labelComp.communicator, 'fireMessage');
            let click = new Event('click');
            labelComp.el.dispatchEvent(click);

            expect(spy.callCount).toBe(0);

            spy.restore();
            done();
        });
    });

    describe('do not have SWAN-BUTTON, SWAN-CHECKBOX, SWAN-RADIO, SWAN-SWITCH in children', () => {
        factory.componentDefine(
            'swan-label',
            {
                template: `
                <view>
                    <label s-ref='label'>
                        <view s-ref="view"></view>
                        hello
                    </label>
                </view>
                `
            },
            properties
        );
        const TestView = factory.getComponents('swan-label');
        const testview = new TestView();
        testview.attach(document.body);
        const labelComp = testview.ref('label');

        it('should not fire message LabelFirstTapped while click label', done => {
            let spy = sinon.spy(labelComp.communicator, 'fireMessage');
            labelComp.el.click();

            expect(spy.callCount).toBe(0);

            spy.restore();
            done();
        });
    });

    describe('do not have any child', () => {
        factory.componentDefine(
            'swan-label',
            {
                template: `
                <swan-page>
                    <label s-ref='label'></label>
                </swan-page>
                `
            },
            properties
        );
        const TestView = factory.getComponents('swan-label');
        const testview = new TestView();
        testview.attach(document.body);
        const labelComp = testview.ref('label');

        it('should not fire message LabelFirstTapped while click label', done => {

            let spy = sinon.spy(labelComp.communicator, 'fireMessage');
            labelComp.el.click();

            expect(spy.callCount).toBe(0);

            spy.restore();
            done();
        });
    });

    describe('have SWAN-BUTTON, SWAN-CHECKBOX, SWAN-RADIO, SWAN-SWITCH in parentNode', () => {
        factory.componentDefine(
            'swan-label',
            {
                template: `
                <view>
                    <button s-ref='button'>
                        <label s-ref='label'>hello</label>
                    </button>
                </view>
                `
            },
            properties
        );
        const TestView = factory.getComponents('swan-label');
        const testview = new TestView();
        testview.attach(document.body);
        const labelComp = testview.ref('label');

        it('should not fire message LabelFirstTapped while click label', done => {

            let spy = sinon.spy(labelComp.communicator, 'fireMessage');
            labelComp.el.click();

            expect(spy.callCount).toBe(0);

            spy.restore();
            done();
        });
    });
});

describe('component [' + COMPONENT_NAME + ']', () => {
    let component = buildComponent(COMPONENT_NAME, labelComponent, {
        data: {
            'for': 'for-id'
        }
    });
    let $component = attach2Document(component);
    it('should not fire message LabelTapped while label has for attribute but there dont have a dom with this id', done => {

        let spy = sinon.spy(component.communicator, 'fireMessage');
        component.el.click();

        expect(spy.callCount).toBe(0);

        spy.restore();
        done();
    });
});

describe('component [' + COMPONENT_NAME + ']', () => {
    let component = null;
    let $component = null;
    let spy = null;
    let stub = null;
    beforeEach(() => {
        component = buildComponent(COMPONENT_NAME, labelComponent);
        $component = attach2Document(component);
        spy = sinon.spy(component, 'labelClick');
        stub = sinon.stub(component, 'isLabelTargetTagInParents').callsFake(function (arg) {
            return false;
        });
    });
    afterEach(() => {
        component.dispose();
        $component = null;
        spy = null;
        stub = null;
    });

    it('should call labelClick when label is clicked', done => {

        $component.querySelector('swan-label').click();
        expect(spy.called).toBe(true);
        spy.restore();
        stub.restore();
        done();
    });

    it('should fire LabelTapped when label click and typeof for is string', done => {

        component = buildComponent(COMPONENT_NAME, labelComponent, {
            data: {
                'for': 'checked123'
            }
        });
        $component = attach2Document(component);
        const componentCheck = buildComponent('check', checkComponent, {
            data: {
                id: 'checked123',
                checked: false
            }
        });
        attach2Document(componentCheck);
        spy = sinon.spy(component, 'labelClick');
        stub = sinon.stub(component, 'isLabelTargetTagInParents').callsFake(function (arg) {
            return false;
        });

        const callback = sinon.spy();
        const event = new Event('click');
        const labelEle = $component.querySelector('swan-label');
        component.communicator.onMessage('LabelTapped', callback);
        labelEle.dispatchEvent(event);
        expect(
            callback.calledOnceWith(
                sinon.match
                    .has('type', 'LabelTapped')
                    .and(
                        sinon.match.has(
                            'data',
                            sinon.match.has('target', document.body.querySelector(`#${component.data.get('for')}`).sanComponent.id)
                                .and(sinon.match.has('event', event))
                        )
                )
            )
        ).toBe(true);
        component.nextTick(() => {
            expect(componentCheck.data.get('__checked')).toBe(true);
            spy.restore();
            stub.restore();
            done();
        });
    });
});
