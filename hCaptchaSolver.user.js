// ==UserScript==
// @name         noCaptcha AI hCaptcha Solver
// @namespace    https://nocaptchaai.com
// @version      0.3
// @description  noCaptcha AI recognizes and solves hcaptcha challenges with our HTTP Api. ll tell your mom about it, lot faster than 2captcha and others.
// @author       noCaptcha AI and Diego
// @match        https://*.hcaptcha.com/*
// @match        https://nocaptchaai.com/config.html
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @icon         https://raw.githubusercontent.com/noCaptchaAi/nocaptchaai.github.io/main/src/assets/favicons/logo.png
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==
// Get Free api key here https://nocaptchaai.com
// Cheap promo 30k solves for 10$
// Unlimited plans starts from 99$
// Selenium, puppeteer, python, playwright scripts https://github.com/shimuldn/hCaptchaSolverApi/tree/main/usage_examples

(async function noCaptcha() {
    'use strict';
    if (location.href === 'https://diegosawyer.github.io/hCaptchaSolver.user.js/') {
        const broadcastChannel = new BroadcastChannel('nocaptcha');
        broadcastChannel.postMessage({ uid: GM_getValue('uid'), apikey: GM_getValue('apikey'), isinstalled: true })
        broadcastChannel.addEventListener('message', function({data}) {
            console.log('Got message', data);
            GM_setValue('uid', data.uid);
            GM_setValue('apikey', data.apikey);
        });
        return;
    }

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
          baseUrl = 'https://free.nocaptchaai.com/api/solve',
          searchParams = new URLSearchParams(location.hash);

    if (!GM_getValue('uid') || !GM_getValue('apikey')) return;
    if (!navigator.language.startsWith('en')) return;

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

    if (response.status == 'new') {
        await sleep(2000);
        const status = await (await fetch(response.url)).json();
        console.log(response, status)
        if (status.status == 'solved') {
            for (const index of status.solution) {
                imgs[index].click();
                await sleep(200);
            }
        }
    } else {
        return alert(response.status);
    }

    let btn = document.querySelector('.button-submit').textContent;
    await sleep(200);
    document.querySelector('.button-submit').click();

    if (btn == 'Verify') {
        await sleep(2000)
        btn = document.querySelector('.button-submit').textContent;
        if (btn == 'Next' || btn == 'Skip') {
            noCaptcha()
        }
    } else if (btn == 'Next' || btn == 'Skip') {
        noCaptcha()
    } else {
        await sleep(1000)
    }
})();
