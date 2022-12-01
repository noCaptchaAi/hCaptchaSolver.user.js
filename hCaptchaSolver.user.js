// ==UserScript==
// @name         hCaptcha Captcha Solver by noCaptchaAi
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      2.0.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru  hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        *://*/*
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @require      https://raw.github.com/odyniec/MonkeyConfig/master/monkeyconfig.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==
const baseUrl = 'https://free.nocaptchaai.com/api/solve';
const cfg = new MonkeyConfig({
    title: 'noCaptchaAi Configuration',
    menuCommand: true,
    params: {
        UID: {
            type: 'text',
            default: ''
        },
        APIKEY: {
            type: 'text',
            default: ''
        },
        auto_solve: {
            type: 'checkbox',
            default: true
        },
        auto_open: {
            type: 'checkbox',
            default: true
        }
    }
});

function isWidget() {
    if (document.body.getBoundingClientRect()?.width === 0 || document.body.getBoundingClientRect()?.height === 0) {
        return false;
    }
    return document.querySelector('div.check') !== null;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function on_task_ready(i = 500) {
    return new Promise(async resolve => {
        const check_interval = setInterval(async function() {
            let target = document.querySelector(".prompt-text")?.textContent;
            if (!target) return;

            const cells = document.querySelectorAll('.task-image .image');
            if (cells.length !== 9) return;

            const images = {};
            for (let i = 0; i < cells.length; i++) {
                const img = cells[i];
                if (!img) return;
                const url = img.style.background.match(/url\("(.*)"/).at(1) || null;
                if (!url || url === '') return;
                images[i] = await getBase64FromUrl(url);
            }

            clearInterval(check_interval);
            return resolve({target, cells, images});
        }, i);
    })
}

async function getBase64FromUrl(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener("loadend", function () {
            resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
        });
    });
}


async function solve() {
    const {target, cells, images} = await on_task_ready();
    console.log(target, cells, images)
    if (!cfg.get('auto_solve')) {
        return;
    }
    const searchParams = new URLSearchParams(location.hash);

    try {
        let response = await fetch(baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                uid: cfg.get('UID'),
                apikey: cfg.get('APIKEY'),
            },
            body: JSON.stringify({
                images,
                target,
                method: "hcaptcha_base64",
                sitekey: searchParams.get("sitekey"),
                site: searchParams.get("host"),
                ln: document.documentElement.lang || navigator.language,
                softid: "UserScript",
            })
        });

        response = await response.json();

        if (response.status == "new") {
            await sleep(6000);
            const status = await (await fetch(response.url)).json();
            for (const index of status.solution) {
                cells[index].click();

            }
        } else if (response.status === "solved") {
            for (const index of response.solution) {
                cells[index].click();
                await sleep(300);
            }
        } else {
            return console.log(response.status);
        }

        await sleep(200);
        document.querySelector('.button-submit').click();
    } catch (error) {
        console.error(error);
    }
}

while (true) {
    if (!navigator.onLine) break;

    await sleep(1000);

    if (cfg.get('auto_open') && isWidget()) {
        const isSolved = document.querySelector('div.check')?.style.display === 'block';
        if (isSolved) break;
        await sleep(500);
        document.querySelector("#checkbox")?.click();
    } else if (cfg.get('auto_solve') && document.querySelector('h2.prompt-text') !== null) {
        await solve();
    }
}
