/**
 * @file event
 * @author yangzongjun@baidu.com
 */

import {
    getCustomEventMap
} from '../../../src/utils/event';

describe('utils date', () => {
    it('getCustomEventMap', () => {
        let params = {
            bindap: [{
                declaration: {
                    expr: {
                        raw: "eventHappen('a,b,'c',)"
                    }
                }
            }]
        };
        let res = getCustomEventMap(params);
        expect(JSON.stringify(res)).toEqual('{"bindap":"c"}');
    });
});
