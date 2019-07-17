<swan-video data-sanid="{{__sanId}}" class="swan-android-video" style="{{videoWrapStyle}}"
    data-swan-same-layer="1" on-click="onVideoWrapClick">
    <video s-ref="video"
        on-timeupdate="onTimeUpdate"
        on-durationchange="onDurationChange"
        on-ended="onPlayEnded"
        on-pause="onPlayPause"
        on-play="onPlayStart"
        on-playing="onPlaying"
        on-error="onPlayError"
        on-loadedmetadata="onLoadedMetaData"
        on-waiting="onPlayWaiting"
        preload="none"
        src="{{__src}}" poster="{{__poster}}" style="{{videoStyle}}"
        t7-video-player-type="inline"></video>
    <div s-ref="danmu" class="swan-video-danmu-wrap"></div>
    <div class="swan-video-controls">
        <div s-ref="gestureMask" class="swan-video-gesture-mask"
            on-touchstart="onPageGestureTouchStart"
            on-touchmove="onPageGestureTouchMove"
            on-touchend="onPageGestureTouchEnd"
            s-if="__enableProgressGesture || __pageGesture || __isFullscreen"></div>
        <div class="swan-video-circle-btn swan-video-lock-btn"
            style="{{videoLockBtnStyle}}"
            on-click="onToggleFullscreenLock" s-if="__isFullscreen">
            <i class="swan-video-btn-icon
                {{__isLockFullscreen ? 'swan-video-i-lock' : 'swan-video-i-unlock'}}"></i>
        </div>
        <div class="swan-video-circle-btn swan-video-play-btn" style="{{videoControlStyle}}"
            on-click="onTogglePlay" s-if="__showCenterPlayBtn">
            <i class="swan-video-btn-icon {{__isPlaying ? 'swan-video-i-pause' : 'swan-video-i-play'}}"></i>
        </div>
        <div class="swan-video-bottom-control" style="{{videoControlStyle}}"
            s-if="__isVideoOpened && __isVideoFocus && __controls">
            <i class="swan-video-bottom-op-btn {{__isPlaying ? 'swan-video-i-pause' : 'swan-video-i-play'}}"
                on-click="onTogglePlay" s-if="__showPlayBtn"></i>
            <div class="swan-video-progress-bar" s-if="videoShowProgress">
                <div class="swan-video-curr-time">{{videoPlayedTime}}</div>
                <div class="swan-video-progress-bar-inner"
                    on-touchstart="onProgressTouchStart"
                    on-touchmove="onProgressTouchMove"
                    on-touchend="onProgressTouchEnd"
                    on-click="onProgressClick">
                    <div s-ref="slider" class="swan-video-progress-slider">
                        <div class="swan-video-progress-slider-track"
                            style="width: {{videoPlayedPercent}}%"></div>
                        <div class="swan-video-progress-slider-handler
                            {{__isProgressSliderFocus ? ' swan-video-progress-slider-handler-focus' : ''}}"
                            style="left: {{videoPlayedPercent}}%"></div>
                    </div>
                </div>
                <div class="swan-video-total-time">{{videoTotalTime}}</div>
            </div>
            <div class="swan-video-progress-bar-placeholder" s-else></div>
            <i on-click="onToggleDanmuShow" class="swan-video-bottom-op-btn
                {{__isShowDanmu ? 'swan-video-i-danmu-enabled' : 'swan-video-i-danmu-disabled'}}"
                s-if="__showDanmuBtn"></i>
            <i on-click="onToggleAudio" class="swan-video-bottom-op-btn
                {{__isMuted ? 'swan-video-i-audio-muted' : 'swan-video-i-audio'}}" s-if="__showMuteBtn"></i>
            <i on-click="onToggleFullscreen" class="swan-video-bottom-op-btn
                {{__isFullscreen ? 'swan-video-i-fullscreen-exit' : 'swan-video-i-fullscreen'}}"
                s-if="__showFullscreenBtn"></i>
        </div>
    </div>
    <div class="swan-video-spinner swan-video-i-loading" style="display: {{__showLoading ? 'block' : 'none'}}"></div>
    <div class="swan-video-progress-state" s-if="__isPageGestureUpProgress">
        <i class="swan-video-up-state-icon {{__isPageGestureProgressForward ? 'swan-video-i-forward' : 'swan-video-i-backward'}}"></i>
        <div class="swan-video-time-info">
            <span class="swan-video-curr-time">{{videoPlayedTime}}</span>
            <span class="swan-video-time-separator">&#47;</span>
            <span class="swan-video-total-time">{{videoTotalTime}}</span>
        </div>
        <div class="swan-video-progress-bar">
            <div s-ref="stateSlider" class="swan-video-progress-bar-inner">
                <div class="swan-video-progress-slider">
                    <div class="swan-video-progress-slider-track"
                        style="width: {{videoPlayedPercent}}%"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="swan-video-voice-light-state" s-if="__isPageGestureUpVoiceLight">
        <i class="{{voiceLightStateIconClass}}"></i>
        <div class="swan-video-voice-light-value">
            {{__isUpLightState ? __lightPercent : __voicePercent}}%
        </div>
    </div>
    <div class="swan-video-play-result-state" s-if="__isPlayError || (__isPlayEnded && !__loop)">
        <div class="swan-video-circle-btn" on-click="onRePlay">
            <i class="swan-video-btn-icon {{__isPlayError ? 'swan-video-i-refresh' : 'swan-video-i-replay'}}"></i>
        </div>
        <div class="swan-video-play-result-state-tip">
            {{__isPlayError ? '视频播放失败，请重试' : '重播'}}
        </div>
    </div>
    <div class="swan-video-network-state" s-if="__showNoWifiTip">
        <div class="swan-video-network-tip">{{__noNetwork ? '网络不给力，请稍后重试' : '无可用Wifi，使用移动网络继续播放'}}</div>
        <div class="swan-video-play-go-on" on-click="onGoOnPlaying">{{__noNetwork ? '点击重试' : '继续播放'}}</div>
    </div>
    <div class="swan-video-back-btn" style="{{videoBackControlStyle}}" s-if="__isFullscreen">
        <i class="swan-video-i-back" on-click="onFullscreenBack"></i>
    </div>
    <div class="swan-video-slot" style="{{slotStyle}}" id="{{__slotId}}" s-ref="slot"><slot></slot></div>
</swan-video>
