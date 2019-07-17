import sinon from 'sinon';
import text from '../../../src/text/index';
import buildComponent from '../../mock/swan-core/build-component';
import componentBaseFieldCheck from '../../utils/component-base-field-check';
import attach2Document from '../../utils/attach-to-document';
import {getComponentClass,getFactory} from '../../mock/swan-core/build-component';
import { get } from 'http';
const COMPONENT_NAME = 'text';

describe('component [' + COMPONENT_NAME + ']', () => {
    const component = buildComponent(COMPONENT_NAME, text);
    const $component = attach2Document(component);

    componentBaseFieldCheck(COMPONENT_NAME, component);
    it('should be render while attach', () => {
        console.log('component',  $component);
        let $swanText = $component.querySelector('swan-text');
        let $innerSpan = $component.querySelector('swan-text>span');
        expect($swanText).not.toBe(null);
        expect($innerSpan).not.toBe(null);
    });
    it('should has one default slot', () => {
        expect(component.slot.length).toBe(1);
    });
});

describe('component [' + COMPONENT_NAME + '] with init data', () => {
    const component = buildComponent(COMPONENT_NAME, text, {
        data:{
            selectable: true,
            space: 'ensp'
        }
    });
    const $component = attach2Document(component);
    it('should has init data', () => {
        const $swanText = $component.querySelector('.text-selectable');
        expect($swanText).not.toBe(null);
    });
});

describe('component [' + COMPONENT_NAME + ']', () => {
    const componentText = getComponentClass(COMPONENT_NAME, text);
    const factory = getFactory();
    factory.componentDefine(
        'test-text',
        {
            template: `
            <view>
                <text s-ref="component">{{test}}<text s-ref="component-child"></text></text>
            </view>
            `,
            initData() {
                return {
                    test: 'a'
                }
            }
        },
        {
            classProperties: {
                components: {
                    'text': componentText
                }
            }
        }
    );
    const TestView = factory.getComponents('test-text');
    const testview = new TestView();
    attach2Document(testview);
    it('should update showText while slot change', done => {
        expect(testview.ref('component').ref('showText').innerHTML.indexOf('a')).toBe(0);
        testview.ref('component');
        testview.data.set('test', 'b');
        testview.nextTick(() => {
            testview.ref('component').communicator.fireMessage({
                type: 'slaveUpdated'
            });
            testview.nextTick(() => {
                expect(testview.ref('component').ref('showText').innerHTML.indexOf('b')).toBe(0);
                done();
            });
        });
    });
});