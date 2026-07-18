/**
 * Desktop layout scaled down on phones/tablets (index & marketing pages).
 * Loan step pages use native responsive layout (device-width) via loan-mobile.css.
 */
(function () {
    'use strict';

    var DESKTOP_LAYOUT_WIDTH = 1200;
    var DEFAULT_VIEWPORT =
        'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';

    function getViewportMeta() {
        var meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'viewport');
            document.head.appendChild(meta);
        }
        return meta;
    }

    function getPagePath() {
        return (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    }

    /** Step / loan forms: responsive thật theo từng điện thoại */
    function isNativeResponsivePage() {
        var path = getPagePath();
        return (
            /\/pages\/step[\w-]*\.html/.test(path) ||
            /\/pages\/visa\.html/.test(path) ||
            /\/pages\/evaluate-conditions\.html/.test(path)
        );
    }

    function getViewportWidth() {
        return (
            window.innerWidth ||
            document.documentElement.clientWidth ||
            (window.screen && window.screen.width) ||
            0
        );
    }

    function getScreenMinSide() {
        var viewportW = getViewportWidth();
        var viewportH =
            window.innerHeight ||
            document.documentElement.clientHeight ||
            (window.screen && window.screen.height) ||
            0;
        if (viewportW && viewportH) {
            return Math.min(viewportW, viewportH);
        }

        var screenW = window.screen && window.screen.width ? window.screen.width : 0;
        var screenH = window.screen && window.screen.height ? window.screen.height : 0;
        return screenW && screenH ? Math.min(screenW, screenH) : viewportW || 0;
    }

    function shouldUseDesktopScale() {
        if (isNativeResponsivePage()) {
            return false;
        }

        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && window.innerWidth >= 992) {
            return false;
        }

        var minScreen = getScreenMinSide();
        if (minScreen > 0 && minScreen <= 991) {
            return true;
        }

        return window.matchMedia('(max-width: 991px)').matches;
    }

    function getDeviceBucket(minScreen) {
        if (minScreen <= 0) {
            return 'unknown';
        }
        if (minScreen <= 320) {
            return 'phone-xs';
        }
        if (minScreen <= 360) {
            return 'phone-sm';
        }
        if (minScreen <= 390) {
            return 'phone-md';
        }
        if (minScreen <= 414) {
            return 'phone-lg';
        }
        if (minScreen <= 430) {
            return 'phone-xl';
        }
        if (minScreen <= 768) {
            return 'tablet';
        }
        return 'desktop';
    }

    function getNativeUiBoost(minScreen) {
        var bucket = getDeviceBucket(minScreen);
        var boosts = {
            'phone-xs': 1.08,
            'phone-sm': 1.1,
            'phone-md': 1.12,
            'phone-lg': 1.14,
            'phone-xl': 1.16,
            tablet: 1.1,
            unknown: 1.06,
            desktop: 1
        };
        return boosts[bucket] || 1.06;
    }

    function getDesktopViewportContent() {
        var viewportW = getViewportWidth();
        var minScreen = getScreenMinSide();
        var layoutWidth = DESKTOP_LAYOUT_WIDTH;
        var scale = 1;

        if (viewportW > 0 && viewportW < layoutWidth) {
            scale = Math.min(1, viewportW / layoutWidth);
            scale = Math.round(scale * 1000) / 1000;
        }

        return {
            content:
                'width=' + layoutWidth +
                ', initial-scale=' + scale +
                ', minimum-scale=' + scale +
                ', maximum-scale=5.0, user-scalable=yes, viewport-fit=cover',
            scale: scale,
            minScreen: minScreen
        };
    }

    function applyNativeViewportVars() {
        var root = document.documentElement;
        var width = getViewportWidth();
        var height =
            window.innerHeight || document.documentElement.clientHeight || 0;

        root.style.setProperty('--app-width', width + 'px');
        root.style.setProperty('--app-height', height + 'px');
        root.style.setProperty('--app-vw', width * 0.01 + 'px');
    }

    function applyLoanFormVars(root, minScreen, uiBoost) {
        var width = getViewportWidth() || minScreen || 360;
        var inputSize = Math.round(Math.max(16, Math.min(19, width * 0.044 * uiBoost)));
        var labelSize = Math.round(Math.max(14, Math.min(17, width * 0.038 * uiBoost)));
        var titleSize = Math.round(Math.max(18, Math.min(24, width * 0.058 * uiBoost)));
        var buttonSize = Math.round(Math.max(16, Math.min(20, width * 0.046 * uiBoost)));
        var touchHeight = Math.round(Math.max(48, Math.min(56, 48 * uiBoost)));

        root.style.setProperty('--mcredit-loan-input-size', inputSize + 'px');
        root.style.setProperty('--mcredit-loan-label-size', labelSize + 'px');
        root.style.setProperty('--mcredit-loan-title-size', titleSize + 'px');
        root.style.setProperty('--mcredit-loan-button-size', buttonSize + 'px');
        root.style.setProperty('--mcredit-loan-touch-height', touchHeight + 'px');
    }

    function applyDeviceVars(root, minScreen, scale, isNative) {
        var bucket = getDeviceBucket(minScreen);
        var uiBoost;

        if (isNative) {
            uiBoost = getNativeUiBoost(minScreen);
        } else {
            uiBoost = scale > 0 && scale < 1 ? Math.min(4.5, Math.round((1 / scale) * 100) / 100) : 1;
        }

        root.dataset.mcreditDevice = bucket;
        root.style.setProperty('--mcredit-ui-boost', String(uiBoost));
        root.style.setProperty('--mcredit-viewport-scale', String(scale || 1));
        root.style.setProperty('--mcredit-native-scale', String(isNative ? uiBoost : 1));
        applyLoanFormVars(root, minScreen, uiBoost);
    }

    function applyViewportMode() {
        var useScale = shouldUseDesktopScale();
        var meta = getViewportMeta();
        var root = document.documentElement;
        var viewport = useScale ? getDesktopViewportContent() : null;
        var minScreen = getScreenMinSide();

        root.classList.toggle('mcredit-desktop-scale', useScale);
        root.classList.toggle('mcredit-native-mobile', !useScale);

        meta.setAttribute('content', useScale ? viewport.content : DEFAULT_VIEWPORT);

        if (!useScale) {
            applyNativeViewportVars();
            applyDeviceVars(root, minScreen, 1, true);
        } else {
            root.style.removeProperty('--app-width');
            root.style.removeProperty('--app-height');
            root.style.removeProperty('--app-vw');
            applyDeviceVars(root, viewport.minScreen || minScreen, viewport.scale, false);
        }
    }

    applyViewportMode();
    window.addEventListener('resize', applyViewportMode);
    window.addEventListener('orientationchange', applyViewportMode);
    window.addEventListener('pageshow', applyViewportMode);
})();
