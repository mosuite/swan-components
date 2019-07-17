/**
 * @file na-comp
 * @author yangzongjun@baidu.com
 */

import {
    getParentCompInfo
} from '../../../src/utils/na-comp';

describe('utils na-comp', () => {
    it('getParentCompInfo', () => {
        let params = {
            parentComponent: {
                el: {
                    tagName: 'swan-template'
                }
            }
        };
        let res = getParentCompInfo(params);
        expect(JSON.stringify(res)).toEqual('{"parentTagName":null}');
    });
});
