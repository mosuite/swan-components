import superCustomComponent from '../../../src/super-custom-component';
import view from '../../../src/view';
import buildComponent from '../../mock/swan-core/build-component';
import {getComponentClass, getFactory} from '../../mock/swan-core/build-component';
import attach2Document from '../../utils/attach-to-document';
import sinon from 'sinon';

const COMPONENT_NAME = 'super-custom-component';
describe('component [' + COMPONENT_NAME + ']', () => {
    const viewComponent = buildComponent('swan-view', view);
    const $viewComponent = attach2Document(viewComponent);
    const factory = getFactory();
    factory.componentDefine(
        'custom-component',
        Object.assign({}, superCustomComponent, {
            template: '<swan-cus-comp><view>aaa</view></swan-cus-comp>',
            componentPath: 'super-custom-component-test',
            componentName: 'super-custom-component-test',
            customComponentCss: ''
        }),
        {
            classProperties: {
                components: Object.assign({}, factory.getAllComponents())
            }
        }
    );
    const CustomComponent = factory.getComponents('custom-component');

    factory.componentDefine('test', {
        template: '<view><swan-cus-comp s-ref="cus"></swan-cus-comp></view>'
    }, {
        classProperties: {
            components: {
                'swan-cus-comp': CustomComponent
            }
        }
    });
    const TestView = factory.getComponents('test');
    const testView = new TestView();
    attach2Document(testView);
    const cus = testView.ref('cus');
    const cusUid = cus.uid;

    it('should handle initData message', () => {
        cus.communicator.fireMessage({
            type: 'initData',
            extraMessage: {
                componentsData: {
                    'super-custom-component-test': {
                        a: 0
                    }
                }
            }
        });

        cus.getDispatchEventObj();
        cus.getFormValue();
        cus.owner = {_update: () => {}, eventHappen: () => {}};
        cus.eventHappen();

        const stub = sinon.stub(cus, 'customComponentCss').value('customComponentCss');
        cus.insertStyle();
        stub.restore();

        expect(cus.data.get('a')).toBe(0);
        cus.data.set('a', 1);
        expect(cus.data.get('a')).toBe(1);
    });

    it('should handle setCustomComponentData message', () => {
        cus.communicator.fireMessage({
            type: 'setCustomComponentData',
            operationSet: [{
                options: {
                    nodeId: cusUid
                },
                setObject: {
                    b: 1
                }
            }]
        });
        expect(cus.data.get('b')).toBe(1);
    });

    it('should handle customComponentInnerBehavior message', () => {
        cus.communicator.fireMessage({
            type: 'customComponentInnerBehavior',
            nodeId: cusUid,
            extraMessage: {
                eventType: 'insertFormField'
            }
        });
        const actual = typeof cus.insertFormField;
        const expected = 'function';
        expect(actual).toBe(expected);
    });

    afterAll(() => {
        testView.dispose();
    });
});
