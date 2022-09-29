// ==UserScript==
// @name         noCaptcha AI hCaptcha Solver base64
// @namespace    https://nocaptchaai.com
// @version      1.0.1
// @description  noCaptcha AI recognizes and solves hcaptcha challenges with our HTTP Api. ll tell your mom about it, lot faster than 2captcha and others.
// @author       noCaptcha AI and Diego
// @match        https://*.hcaptcha.com/*
// @match        https://config.nocaptchaai.com/*
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// ==/UserScript==
const broadcastChannel = new BroadcastChannel('nocaptcha');
broadcastChannel.postMessage({ uid: GM_getValue('uid'), apikey: GM_getValue('apikey') });
broadcastChannel.addEventListener('message', function({ data, origin }) {
    if (origin != 'https://config.nocaptchaai.com') return;
    console.log('Got message', data);
    GM_setValue('uid', data.uid);
    GM_setValue('apikey', data.apikey);
    noCaptcha()
});

GM_registerMenuCommand('Open Config Webpage', function() {
    GM_openInTab('https://config.nocaptchaai.com')
}, 'O');

if (!navigator.onLine) return;
if (!GM_getValue('uid') || !GM_getValue('apikey')) {
    if (!GM_getValue('notified')) {
        GM_openInTab('https://config.nocaptchaai.com?msg=Please enter your details on the page before starting to use the userscript', 'active');
        GM_setValue('notified', true);
    }
    return;
}
navigator.__defineGetter__('language', () => 'en');

if (GM_info.scriptHandler == 'Violentmonkey') {
  window.addEventListener('load', noCaptcha)
} else {
  noCaptcha();
}

function random(min,max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function getBase64FromUrl(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener('loadend', function() {
            resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""))
        })
    });
}

async function noCaptcha() {

    const baseUrl = 'https://free.nocaptchaai.com/api/solve',
          searchParams = new URLSearchParams(location.hash),
          images = {};

    await sleep(1000);
    document.querySelector('#checkbox')?.click();
    await sleep(2000);

    const imgs = document.querySelectorAll('.task-image .image');
    // const images = {...[...imgs].map(ele => ele.style.background.match(/url\("(.*)"/)[1] || 0)};
    // const images = await [...imgs].reduce(async function(acc, element, index) {
    //     const url = element.style.background.match(/url\("(.*)"/)[1]
    //     if (!url) return;
    //     return { [index]: await getBase64FromUrl(url), ...acc };
    // }, {})
    const start = performance.now() / 1000;
    for (let i = 0; i < imgs.length; i++) {
        const url = imgs[i].style.background.match(/url\("(.*)"/)[1]
        if (!url) break;
        images[i] = await getBase64FromUrl(url)
    }
    if (Object.keys(images).length === 0) return;
    const end = performance.now() / 1000
    console.log('converted to base64 in', (end-start).toFixed(2), 'sec');

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
            'method': 'hcaptcha_base64',
            'sitekey': searchParams.get('sitekey'),
            'site': searchParams.get('host'),
            'softid': 'UserScript',
        })
    })
    response = await response.json();

    if (response.status == 'new') {
        await sleep(2000);
        let status = await (await fetch(response.url)).json();
        if (status.status == 'in queue') {
            await sleep(3000);
            status = await (await fetch(response.url)).json();
        }
        if (status.status == 'solved') {
            for (const index of status.solution) {
                imgs[index].click();
                await sleep(200);
            }
        }
        console.log(response, status);
    } else if (response.status === 'solved') {
        for (const index of response.solution) {
            imgs[index].click();
            await sleep(random(400, 250));
        }
    } else {
        return alert(response.status);
    }

    await sleep(random(3000, 2000));
    document.querySelector('.button-submit').click();
    noCaptcha()
}
