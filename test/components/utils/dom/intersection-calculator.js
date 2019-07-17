/**
 * @file intersection-calculator
 * @author yangzongjun@baidu.com
 */

import {
    computeObserverIntersection
} from '../../../../src/utils/dom/swanXml/intersection-calculator';

describe('utils computeObserverIntersection', () => {
    it('computeObserverIntersection', () => {
        let contextIdElement = document.createElement('div');
        contextIdElement.id = 'contextId2';
        document.body.appendChild(contextIdElement);

        let res = computeObserverIntersection(
            {
                targetNode: contextIdElement,
                relatives: [
                    {node: '', margins: ''}
                ],
                thresholds: [3],
                cb: () => {}
            }
        );
        expect(res).toEqual(undefined);
    });
});
