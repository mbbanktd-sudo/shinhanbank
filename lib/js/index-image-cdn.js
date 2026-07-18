/**
 * Offline image resolver: load from mcredit.com.vn CDN when online,
 * fall back to local SVG assets when offline.
 */
(function (global) {
    'use strict';

    var CDN_BASE = 'https://mcredit.com.vn/';

    var LOCAL_OK = {
        'image/bell.svg': true,
        'image/search.svg': true,
        'image/user.svg': true,
        'image/icon-check.svg': true,
        'image/logo-mcredit.svg': true,
        'image/promo-loan.svg': true,
        'image/content-fallback.svg': true,
        'image/qr-loan.svg': true,
        'image/Placeholder.svg': true,
        'image/doc.svg': true,
        'image/care.svg': true,
        'image/money.svg': true,
        'image/logo-momo.svg': true,
        'image/logo-zalopay.svg': true,
        'image/logo-vtcpay.svg': true,
        'image/bank-generic.svg': true,
        'image/flag-vn.svg': true,
        'image/mbbank/imgi_1_icons-login.svg': true,
        'image/mbbank/imgi_3_logo-blue.svg': true
    };

    var LOCAL_MAP = {
        'content/132838575177542222_b099aacca88b62d53b9a.jpg': CDN_BASE + 'content/132838575177542222_b099aacca88b62d53b9a.jpg',
        'content/mcredit-sao-ke-hero.png': CDN_BASE + 'content/mcredit-sao-ke-hero.png',
        'image/mcredit-logo.png': 'image/logo-mcredit.svg',
        'image/Placeholder.png': CDN_BASE + 'image/Placeholder.png',
        'image/home-page.png': CDN_BASE + 'image/home-page.png',
        'image/download-app.png': CDN_BASE + 'image/download-app.png',
        'image/lead-form.png': CDN_BASE + 'image/lead-form.png',
        'image/qr-mcredit.png': 'image/qr-loan.svg',
        'image/step1-banner.png': 'image/promo-loan.svg',
        'image/doc.png': 'image/doc.svg',
        'image/care.png': 'image/care.svg',
        'image/money.png': 'image/money.svg',
        'image/promo-momo-mcredit.png': 'image/promo-loan.svg',
        'image/default_image.png': 'image/Placeholder.svg',
        'image/six-up1.png': 'image/content-fallback.svg',
        'image/six-up2.png': 'image/content-fallback.svg',
        'image/search1.png': 'image/search.svg',
        'image/search2.png': 'image/search.svg',
        'image/search3.png': 'image/search.svg',
        'image/navcard-atm.png': 'image/bank-generic.svg',
        'image/navcard-visa.png': 'image/bank-generic.svg',
        'image/logo-momo.png': 'image/logo-momo.svg',
        'image/logo-zalopay.png': 'image/logo-zalopay.svg',
        'image/tien-mat.png': 'image/money.svg',
        'image/googlePlay.png': CDN_BASE + 'image/googlePlay.png',
        'image/appStore.png': CDN_BASE + 'image/appStore.png',
        'image/Group 504.png': CDN_BASE + 'image/Group%20504.png',
        'image/Group 505.png': CDN_BASE + 'image/Group%20505.png',
        'image/Group 506.png': CDN_BASE + 'image/Group%20506.png',
        'image/Group 507.png': CDN_BASE + 'image/Group%20507.png'
    };

    var PLACEHOLDER = 'image/Placeholder.svg';
    var CONTENT_FALLBACK = 'image/content-fallback.svg';
    var BANK_GENERIC = 'image/bank-generic.svg';

    function normalizePath(url) {
        if (!url) {
            return '';
        }

        var path = String(url).trim().replace(/^\.\//, '');

        if (/^https?:\/\//i.test(path) || /^data:/i.test(path)) {
            return path;
        }

        if (path.charAt(0) === '/') {
            path = path.slice(1);
        }

        return path.split('?')[0].split('#')[0];
    }

    function encodeCdnPath(path) {
        var slash = path.indexOf('/');
        if (slash === -1) {
            return encodeURIComponent(path);
        }

        var prefix = path.slice(0, slash + 1);
        var rest = path.slice(slash + 1);
        return prefix + rest.split('/').map(encodeURIComponent).join('/');
    }

    function toMcreditCdn(path) {
        if (path.indexOf('content/') === 0 || path.indexOf('image/') === 0) {
            return CDN_BASE + encodeCdnPath(path);
        }

        return null;
    }

    function getErrorFallback(original) {
        var path = normalizePath(original);

        if (!path) {
            return PLACEHOLDER;
        }

        if (path.indexOf('content/') === 0 || /\/content\//.test(String(original))) {
            return CONTENT_FALLBACK;
        }

        if (path.indexOf('image/banks/') === 0) {
            return BANK_GENERIC;
        }

        return PLACEHOLDER;
    }

    function resolveMcreditAsset(url) {
        var path = normalizePath(url);

        if (!path || /^https?:\/\//i.test(path) || /^data:/i.test(path)) {
            return url;
        }

        if (LOCAL_OK[path]) {
            return path;
        }

        if (LOCAL_MAP[path]) {
            return LOCAL_MAP[path];
        }

        if (path.indexOf('content/') === 0) {
            return path;
        }

        if (path.indexOf('image/banks/') === 0) {
            return BANK_GENERIC;
        }

        var cdn = toMcreditCdn(path);
        if (cdn) {
            return cdn;
        }

        return url;
    }

    function getOriginalAsset(img) {
        return normalizePath(
            img.dataset.originalAsset ||
            img.getAttribute('data-src') ||
            img.getAttribute('src') ||
            ''
        );
    }

    function patchStyleBackground(el) {
        var style = el.getAttribute('style');
        if (!style || style.indexOf('url(') === -1) {
            return;
        }

        var next = style.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, function (_, quote, rawUrl) {
            return 'url("' + resolveMcreditAsset(rawUrl) + '")';
        });

        if (next !== style) {
            el.setAttribute('style', next);
        }
    }

    function attachErrorFallback(img) {
        if (img.dataset.localFallbackBound === '1') {
            return;
        }

        img.dataset.localFallbackBound = '1';

        if (!img.dataset.originalAsset) {
            img.dataset.originalAsset = getOriginalAsset(img);
        }

        img.addEventListener('error', function onImgError() {
            var original = img.dataset.originalAsset || getOriginalAsset(img);
            var fallback = getErrorFallback(original);
            var current = img.getAttribute('src') || '';

            if (current === fallback) {
                img.removeEventListener('error', onImgError);
                return;
            }

            if (/^https?:\/\//i.test(current)) {
                img.src = fallback;
                return;
            }

            var localPath = normalizePath(original);
            if (localPath.indexOf('content/') === 0) {
                var cdn = toMcreditCdn(localPath);
                if (cdn && current !== cdn) {
                    img.src = cdn;
                    return;
                }
            }

            var resolved = resolveMcreditAsset(original);
            if (resolved !== original && current !== resolved) {
                img.src = resolved;
                return;
            }

            img.src = fallback;
        });
    }

    function patchImage(img) {
        var original = getOriginalAsset(img);
        if (original && !img.dataset.originalAsset) {
            img.dataset.originalAsset = original;
        }

        ['src', 'data-src'].forEach(function (attr) {
            var value = img.getAttribute(attr);
            if (!value) {
                return;
            }

            var resolved = resolveMcreditAsset(value);
            if (resolved !== value) {
                img.setAttribute(attr, resolved);
            }
        });

        attachErrorFallback(img);
    }

    function patchAllImages(root) {
        (root || document).querySelectorAll('img').forEach(patchImage);
        (root || document).querySelectorAll('[style*="url("]').forEach(patchStyleBackground);
    }

    function activateLazyImages() {
        document.querySelectorAll('img[data-src]').forEach(function (img) {
            patchImage(img);

            var dataSrc = img.getAttribute('data-src');
            if (!dataSrc) {
                return;
            }

            var resolved = resolveMcreditAsset(dataSrc);
            var currentSrc = img.getAttribute('src') || '';
            var shouldLoad = !currentSrc ||
                /Placeholder/i.test(currentSrc) ||
                normalizePath(currentSrc).indexOf('content/') === 0;

            if (shouldLoad && (img.classList.contains('lazy') || img.classList.contains('lazyload') || img.getAttribute('loading') === 'lazy')) {
                img.setAttribute('src', resolved);
            }
        });
    }

    function patchMcreditLoadImgs() {
        if (typeof global.loadImgs !== 'function' || global.loadImgs.__mcreditPatched) {
            return;
        }

        global.loadImgs = function loadImgsPatched() {
            if (!global.jQuery) {
                return;
            }

            global.jQuery('.lazy').each(function (_, el) {
                var $el = global.jQuery(el);
                var raw = $el.attr('data-src') || $el.data('src') || '';
                var resolved = resolveMcreditAsset(String(raw));
                $el.attr('data-src', resolved);
                $el.attr('src', resolved);
                attachErrorFallback(el);
            });
        };

        global.loadImgs.__mcreditPatched = true;
    }

    function scheduleLoadImgsHook() {
        var attempts = 0;
        var timer = global.setInterval(function () {
            attempts += 1;
            patchMcreditLoadImgs();

            if (global.loadImgs && global.loadImgs.__mcreditPatched) {
                global.clearInterval(timer);
                if (typeof global.loadImgs === 'function') {
                    global.loadImgs();
                }
            } else if (attempts > 120) {
                global.clearInterval(timer);
            }
        }, 50);
    }

    function observeNewImages() {
        if (!global.MutationObserver) {
            return;
        }

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
                    if (mutation.attributeName === 'data-src' || mutation.attributeName === 'src') {
                        patchImage(mutation.target);
                    }
                    return;
                }

                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) {
                        return;
                    }

                    if (node.tagName === 'IMG') {
                        patchImage(node);
                    }

                    if (node.querySelectorAll) {
                        patchAllImages(node);
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'data-src', 'style']
        });
    }

    function init() {
        patchAllImages(document);
        activateLazyImages();
        observeNewImages();
        scheduleLoadImgsHook();
    }

    global.resolveMcreditAsset = resolveMcreditAsset;
    global.patchMcreditLoadImgs = patchMcreditLoadImgs;
    global.MCREDIT_PLACEHOLDER_IMAGE = PLACEHOLDER;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(window);
