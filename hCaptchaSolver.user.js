// ==UserScript==
// @name         noCaptcha AI hCaptcha Solver
// @namespace    https://nocaptchaai.com
// @version      0.7
// @description  noCaptcha AI recognizes and solves hcaptcha challenges with our HTTP Api. ll tell your mom about it, lot faster than 2captcha and others.
// @author       noCaptcha AI and Diego
// @match        https://*.hcaptcha.com/*
// @match        https://nocaptchaai.com/script/config.html
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @icon         https://raw.githubusercontent.com/noCaptchaAi/nocaptchaai.github.io/main/src/assets/favicons/logo.png
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// ==/UserScript==
// Get Free api key here https://nocaptchaai.com
// Cheap promo 30k solves for 10$
// Unlimited plans starts from 99$
// Selenium, puppeteer, python, playwright scripts https://github.com/shimuldn/hCaptchaSolverApi/tree/main/usage_examples


(async function noCaptcha() {
    'use strict';
    if (location.origin === 'https://nocaptchaai.com') {
        const broadcastChannel = new BroadcastChannel('nocaptcha');
        broadcastChannel.postMessage({ uid: GM_getValue('uid'), apikey: GM_getValue('apikey') });
        broadcastChannel.addEventListener('message', function({data}) {
            console.log('Got message', data);
            GM_setValue('uid', data.uid);
            GM_setValue('apikey', data.apikey);
            alert(`uid ${data.uid.slice(-5)} || apikey last ending with ${data.apikey.slice(-5)} set successfully!\nRefresh your website with hcaptcha to solve!`);
        });
        return;
    }

    if (!GM_getValue('uid') || !GM_getValue('apikey')) {
      if (GM_getValue('notified') == undefined) {
        alert('UID and APIKEY not set. Open https://nocaptchaai.com/script/config.html to add uid and apikey.');
        open('https://nocaptchaai.com/script/config.html');
        GM_setValue('notified', true);
      }
      
      return;
    }
    if (!navigator.language.startsWith('en')) return;

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

    if (response.status == 'new') {
        await sleep(2000);
        const status = await (await fetch(response.url)).json();
        console.log(response, status);
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
