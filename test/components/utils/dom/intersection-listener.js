
/**
 * @file intersection-listener
 * @author yangzongjun@baidu.com
 */

import {
    addIntersectionObserver,
    removeIntersectionObserver
} from '../../../../src/utils/dom/swanXml/intersection-listener';

describe('utils addIntersectionObserver', () => {
    it('addIntersectionObserver', () => {
        let contextIdElement = document.createElement('div');
        contextIdElement.id = 'xxx';
        let child = document.createElement('div');
        child.id = 'intersection-child1';
        contextIdElement.appendChild(child);
        document.body.appendChild(contextIdElement);

        let res = addIntersectionObserver(
            {
                value: {
                    slaveId: '',
                    reqId: '',
                    relativeInfo: [{selector: '#intersection-child1', contextId: 'id'}],
                    options: {selectAll: true},
                    targetSelector: '#xxx',
                    contextId: 'xxx',
                    componentName: 'view'
                }
            },
            {sendMessage: () => {}},
            {}
        );
        expect(res).toEqual(undefined);
    });

    it('addIntersectionObserver2', () => {
        let contextIdElement = document.createElement('div');
        contextIdElement.id = 'context-id-with-child';
        let child = document.createElement('div');
        child.id = 'intersection-child2';
        contextIdElement.appendChild(child);
        document.body.appendChild(contextIdElement);

        let res = addIntersectionObserver(
            {
                value: {
                    slaveId: '',
                    reqId: '',
                    relativeInfo: [{selector: '#intersection-child1', contextId: 'id'}],
                    options: {},
                    targetSelector: '#child',
                    contextId: 'context-id-with-child',
                    componentName: 'view'
                }
            },
            {sendMessage: () => {}},
            {}
        );
        expect(res).toEqual(undefined);
    });

    it('removeIntersectionObserver', () => {
        let res = removeIntersectionObserver(
            {
                value: {
                    slaveId: '',
                    reqId: '',
                    observerId: 'xx'
                }
            },
            {sendMessage: () => {}},
            {xx: ''}
        );
        expect(res).toEqual(undefined);
    });
});
