/**
 * @file Video helper test spec
 * @author wuhuiyao@baidu.com
 */

import {formatTime} from '../../../src/video-android/helper';

describe('同层渲染安卓 Video helper', () => {
    describe('formatTime', () => {
        it('should format time by the given seconds', () => {
            let result = formatTime(23);
            expect(result).toEqual('00:23');

            result = formatTime(60);
            expect(result).toEqual('01:00');

            result = formatTime(600);
            expect(result).toEqual('10:00');

            result = formatTime(3600);
            expect(result).toEqual('01:00:00');

            result = formatTime(64302);
            expect(result).toEqual('17:51:42');
        });
    });
});
