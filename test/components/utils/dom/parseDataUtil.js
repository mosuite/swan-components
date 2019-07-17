
/**
 * @file parseDataUtil
 * @author yangzongjun@baidu.com
 */
import sinon from 'sinon';
import {
    readBoxData,
    readRectData,
    getDataSet,
    getSelectData
} from '../../../../src/utils/dom/swanXml/parseDataUtil';
import buildComponent from '../../../mock/swan-core/build-component';
import attach2Document from '../../../utils/attach-to-document';
import button from '../../../../src/button/index';
import {getComponentClass, getFactory} from '../../../mock/swan-core/build-component';


describe('utils parseDataUtil', () => {
    describe('base feature', () => {
        it('readBoxData', () => {
            let contextIdElement = document.createElement('div');
            contextIdElement.id = 'contextId';
            document.body.appendChild(contextIdElement);

            let res = readBoxData(contextIdElement.getBoundingClientRect());
            expect(res.left).toEqual(0);
        });

        it('readRectData', () => {
            let contextIdElement = document.createElement('div');
            contextIdElement.id = 'contextId';
            document.body.appendChild(contextIdElement);

            let res = readRectData(contextIdElement.getBoundingClientRect());
            expect(res.left).toEqual(0);
        });

        it('getDataSet', () => {
            let component = buildComponent('button', button);
            attach2Document(component);

            let res = getDataSet(component.el);
            expect(JSON.stringify(res)).toEqual('{}');
        });
    });

    describe('getSelectData', () => {
        let contextIdElement;
        let stub;
        beforeAll(() => {
            contextIdElement = document.createElement('div');
            contextIdElement.id = 'contextId';
            contextIdElement.sanComponent = {};
            stub = sinon.stub(contextIdElement, 'sanComponent').value({data: {raw: {}}});
            document.body.appendChild(contextIdElement);
        });
        afterAll(() => {
            stub.restore();
        });

        it('getSelectData: select boundingClientRect', () => {
            let res = getSelectData({
                selector: '#contextId',
                queryType: 'select',
                operation: 'boundingClientRect',
                fields: '',
                contextId: ''
            });
            expect(res.id).toEqual('contextId');
        });

        it('getSelectData: select scrollOffset', () => {
            let res = getSelectData({
                selector: '#contextId',
                queryType: 'select',
                operation: 'scrollOffset',
                fields: '',
                contextId: ''
            });
            expect(res.id).toEqual('contextId');
        });

        it('getSelectData: select fields', () => {
            let res = getSelectData({
                selector: '#contextId',
                queryType: 'select',
                operation: 'fields',
                fields: '',
                contextId: ''
            });
            expect(res.id).toEqual(undefined);
        });

        it('getSelectData: select fields no sanComponent', () => {
            let res = getSelectData({
                selector: '#contextId',
                queryType: 'select',
                operation: 'fields',
                fields: {
                    id: 'a',
                    rect: 'b',
                    scrollOffset: 'scrollOffset',
                    dataset: 'dataset',
                    properties: ['width', 'border-width'],
                    computedStyle: ['width']
                },
                contextId: ''
            });
            expect(res.id).toEqual('contextId');
        });

        it('getSelectData: select fields', () => {
            const componentButton = getComponentClass('button', button);
            const factory = getFactory();
            const properties = {
                classProperties: {
                    components: {
                        button: componentButton
                    }
                }
            };
            factory.componentDefine(
                'swan-label',
                {
                    template: `
                    <swan-page>
                        <button s-ref='label' id="button-select-fields">
                            hello
                        </button>
                    </swan-page>
                    `
                },
                properties
            );
            const TestView = factory.getComponents('swan-label');
            const testview = new TestView();
            testview.attach(document.body);

            let res = getSelectData({
                selector: '#button-select-fields',
                queryType: 'select',
                operation: 'fields',
                fields: {
                    id: 'a',
                    rect: 'b',
                    scrollOffset: 'scrollOffset',
                    dataset: 'dataset',
                    properties: ['width', 'border-width', 'class'],
                    computedStyle: ['width']
                },
                contextId: ''
            });
            expect(res.id).toEqual('button-select-fields');
        });

        it('getSelectData: select contextIdNotExist', () => {
            let res = getSelectData({
                selector: '#contextIdNotExist',
                queryType: 'select',
                operation: '',
                fields: '',
                contextId: ''
            });
            expect(JSON.stringify(res)).toEqual('null');
        });

        it('getSelectData: selectAll', () => {
            let component = buildComponent('button', button);
            attach2Document(component);

            let res = getSelectData({
                selector: '#contextId',
                queryType: 'selectAll',
                operation: '',
                fields: '',
                contextId: ''
            });
            expect(JSON.stringify(res[0])).toEqual('{}');
        });

        it('getSelectData: selectViewport', () => {
            let component = buildComponent('button', button);
            attach2Document(component);

            let res = getSelectData({
                selector: '',
                queryType: 'selectViewport',
                operation: '',
                fields: '',
                contextId: ''
            });
            expect(JSON.stringify(res)).toEqual('{}');
        });
    });

});
