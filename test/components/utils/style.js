/**
 * @file style
 * @author yangzongjun@baidu.com
 */

import {
    hexColor,
    computedStyle,
    getTransitionParams
} from '../../../src/utils/style';

describe('utils style', () => {
    it('style #000', () => {
        let params = '#000';
        let res = hexColor(params);
        expect(res).toEqual(params);
    });

    it('style aaa', () => {
        let params = 'aaa';
        let res = hexColor(params);
        expect(res).toEqual('ff000000');
    });

    it('style 1a2b3c4d', () => {
        let params = '1a2b3c4d';
        let res = hexColor(params);
        expect(res).toEqual('#ff010203');
    });

    it('computedStyle element is null', () => {
        let res = computedStyle(null);
        expect(JSON.stringify(res)).toEqual('{"style":{},"position":{}}');
    });

    it('getTransitionParams element is null', () => {
        let res = getTransitionParams(null);
        expect(JSON.stringify(res)).toEqual('{}');
    });
});
