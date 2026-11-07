(function () {
    'use strict';

    // 保留旧课件的双通道判断接口，但让熊猫模型改走可缓存的二进制 GLB。
    window.PANDA_GLB_BASE64 = '';

    if (!window.THREE || !THREE.GLTFLoader || !THREE.GLTFLoader.prototype) return;
    var prototype = THREE.GLTFLoader.prototype;
    if (prototype.__xuPandaBinaryLoader) return;

    var currentScript = document.currentScript;
    var scriptUrl = currentScript && currentScript.src ? currentScript.src : '';
    var versionMatch = scriptUrl.match(/[?&]v=([^&#]+)/i);
    var versionQuery = versionMatch ? '?v=' + encodeURIComponent(decodeURIComponent(versionMatch[1])) : '';
    var pandaUrl = '/math/daohang/ku/panda.glb' + versionQuery;
    var originalLoad = prototype.load;

    prototype.load = function (url, onLoad, onProgress, onError) {
        if (typeof url === 'string' && /(?:^|\/)熊猫\.glb(?:[?#]|$)/.test(url)) url = pandaUrl;
        return originalLoad.call(this, url, onLoad, onProgress, onError);
    };
    prototype.__xuPandaBinaryLoader = true;
    window.PANDA_GLB_URL = pandaUrl;
})();
