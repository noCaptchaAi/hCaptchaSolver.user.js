// ==UserScript==
// @name         noCaptcha AI hCaptcha Solver base64
// @namespace    https://nocaptchaai.com
// @version      1.0.0
// @description  noCaptcha AI recognizes and solves hcaptcha challenges with our HTTP Api. ll tell your mom about it, lot faster than 2captcha and others.
// @author       noCaptcha AI and Diego
// @match        https://*.hcaptcha.com/*
// @match        https://config.nocaptchaai.com/*
// @match        http://localhost:5555/*
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==
if (location.origin === 'https://config.nocaptchaai.com') {
    const broadcastChannel = new BroadcastChannel('nocaptcha');
    broadcastChannel.postMessage({ uid: GM_getValue('uid'), apikey: GM_getValue('apikey') });
    broadcastChannel.addEventListener('message', function({data}) {
        console.log('Got message', data);
        GM_setValue('uid', data.uid);
        GM_setValue('apikey', data.apikey);
    });
    return;
}

GM_registerMenuCommand('Open Config Webpage', function() {
    GM_openInTab('https://config.nocaptchaai.com')
}, 'O');

(async function noCaptcha() {
    'use strict';
    if (!navigator.onLine) return;
    if (!GM_getValue('uid') || !GM_getValue('apikey')) {
        if (!GM_getValue('notified')) {
            GM_openInTab('https://config.nocaptchaai.com?msg=Please enter your details on the page before starting to use the userscript', 'active');
            GM_setValue('notified', true);
        }
        return;
    }
    navigator.__defineGetter__('language', () => 'en');

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
          baseUrl = 'https://free.nocaptchaai.com/api/solve',
          searchParams = new URLSearchParams(location.hash);

    await sleep(1000);

    function random(min,max) {
        return Math.floor((Math.random())*(max-min)+min);
    }
    
    
    
    document.querySelector('#checkbox')?.click();

    await sleep(2000);

    const getBase64FromUrl = async (url) => {
        const data = await fetch(url);
        const blob = await data.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = reader.result;
            let base64_img =  base64data.replace(/^data:image\/(png|jpeg);base64,/, "");
            resolve(base64_img);
          }
        });
      }
      
      let images = {}
      const imgs = document.querySelectorAll('.task-image .image');
      let t1 = + new Date();
      for (let i = 0; i < imgs.length; i++) {
        let url = imgs[i].style.background.match(/url\("(.*)"/)[1]
        images[i]=await getBase64FromUrl(url)
       
    
      }
    //   if (Object.keys(images).length === 0) return;
    let t2 =+ new Date();
    if (Object.keys(images).length === 9){
        console.log("converted to base64 in", Number((t2-t1)/1000).toFixed(2), "sec");
    }
    
    // console.log(getBase64FromUrl);

    // const imgs = document.querySelectorAll('.task-image .image');
    // const images = {...[...imgs].map(ele => ele.style.background.match(/url\("(.*)"/)[1] || 0)};
    // if (Object.keys(images).length === 0) return;

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
            await sleep(2000);
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

            
            // console.log(random(400,250));
            await sleep(random(400,250));
          }
      }else if (response.status === 'skip') {
        // document.querySelector('.button-submit').click();
        // noCaptcha();
        
      } else {
        return alert(response.status);
    }

    let btn = document.querySelector('.button-submit').textContent;

    console.log('waiting 2-3s');
    await sleep(random(3000,2000));
    
    // document.querySelector('.button-submit').click();

    if (btn == 'Verify') {
        document.querySelector('.button-submit').click();
        noCaptcha();
        // await sleep(2000);
        // btn = document.querySelector('.button-submit').textContent;
        // if (btn == 'Next' || btn == 'Skip') {
        //     noCaptcha();
        // }
    } else if (btn == 'Next' || btn == 'Skip') {
        document.querySelector('.button-submit').click();
        noCaptcha();
    } else {
        await sleep(1000);
    }
})();
