/**
 * @file Video api behavior
 * @author wuhuiyao@baidu.com
 */

export default {

    /**
     * 注册 createVideoContext() 暴露的 API处理
     */
    initAPIRegister() {
        this.communicator.onMessage(`video-${this.data.get('id')}`, event => {
            let {api: apiName, params} = (event && event.value) || {};
            // console.log('receive api event, call api', event, apiName);
            switch (apiName) {
                case 'play':
                    this.play();
                    break;
                case 'pause':
                    this.pause();
                    break;
                case 'seek':
                    this.seek(params && params.position);
                    break;
                case 'sendDanmu':
                    this.sendDanmu(params);
                    break;
                case 'requestFullScreen':
                    this.toggleFullscreen(true);
                    break;
                case 'exitFullScreen':
                    this.toggleFullscreen(false);
                    break;
            }
        });
    }
};
