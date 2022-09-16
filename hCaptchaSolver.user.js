// ==UserScript==
// @name         noCaptcha AI hCaptcha Solver
// @namespace    https://nocaptchaai.com
// @version      0.8
// @description  noCaptcha AI recognizes and solves hcaptcha challenges with our HTTP Api. ll tell your mom about it, lot faster than 2captcha and others.
// @author       noCaptcha AI and Diego
// @match        https://*.hcaptcha.com/*
// @match        https://nocaptchaai.com/script/config.html
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @icon         https://raw.githubusercontent.com/noCaptchaAi/nocaptchaai.github.io/main/src/assets/favicons/logo.png
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// ==/UserScript==
// Get Free api key here https://nocaptchaai.com
// Cheap promo 30k solves for 10$
// Unlimited plans starts from 99$
// Selenium, puppeteer, python, playwright scripts https://github.com/shimuldn/hCaptchaSolverApi/tree/main/usage_examples


(async function noCaptcha() {
    'use strict';
    function notification(name, msg) {
        if (!GM_getValue('notified_' + name)) {
            GM_openInTab('https://nocaptchaai.com/script/config.html?msg='+ msg, 'active');
            GM_setValue('notified_' + name, true);
        }
    }
    if (location.origin === 'https://nocaptchaai.com') {
        const broadcastChannel = new BroadcastChannel('nocaptcha');
        broadcastChannel.postMessage({ action: 'receive', uid: GM_getValue('uid'), apikey: GM_getValue('apikey'), internet: GM_getValue('internet') });
        broadcastChannel.addEventListener('message', function({data}) {
            console.log('Got message', data);
            if (data.action != 'receive') return;
            GM_setValue('uid', data.uid);
            GM_setValue('apikey', data.apikey);
            GM_setValue('internet', data.internet)
            broadcastChannel.postMessage({ action: 'save', msg: 'Saved successfully'});a
        });
        return;
    }

    if (!navigator.onLine) return;
    if (!navigator.language.startsWith('en')) {
       return notification('en', 'Works only in English language browsers');
    }
    if (!GM_getValue('uid') || !GM_getValue('apikey')) {
        return notification('welcome', 'Please enter your details on the page before starting to use the userscript');
    }

    if (GM_getValue('internet')) {
        const slowLoad = setTimeout(function() {
            alert( "slow internet connection the userscript may not work" );
        }, 1500);

        window.addEventListener('load', function() {
            clearTimeout(slowLoad);
        }, false);
    }

    
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
          baseUrl = 'https://free.nocaptchaai.com/api/solve',
          searchParams = new URLSearchParams(location.hash);

    await sleep(1000);

    document.querySelector('#checkbox')?.click();

    await sleep(2000);

    const imgs = document.querySelectorAll('.task-image .image');
    const images = {...[...imgs].map(ele => ele.style.background.match(/url\("(.*)"/)[1] || 0)};
    if (Object.keys(images).length === 0) return;

    let response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'uid': GM_getValue('uid'),
            'apikey': GM_getValue('apikey')
        },
        body: JSON.stringify({
            images,
            'target': document.querySelector('.prompt-text').textContent,
            'data_type': 'url',
            'site_key': searchParams.get('sitekey'),
            'site': searchParams.get('host')
        })
    })
    response = await response.json();

    let btn = document.querySelector('.button-submit').textContent;

    await sleep(200);

    document.querySelector('.button-submit').click();

    if (btn == 'Verify') {
        await sleep(2000);
        btn = document.querySelector('.button-submit').textContent;
        if (btn == 'Next' || btn == 'Skip') {
            noCaptcha();
        }
    } else if (btn == 'Next' || btn == 'Skip') {
        noCaptcha();
    } else {
        await sleep(1000);
    }
})();
