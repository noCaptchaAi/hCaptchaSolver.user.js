// ==UserScript==
// @name         noCaptchaAI hCaptcha Solver
// @namespace    https://nocaptchaai.com
// @version      1.1.3
// @description  Gracefully Solve and Bypass hCaptcha grid-image challenges with noCaptchaAi.com API.⚡ ~ 50x faster than 2Captcha etc. All language support(progress).
// @author       noCaptcha AI and Diego
// @match        https://newassets.hcaptcha.com/*
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @grant        GM_registerMenuCommand
// @inject-into  content
// ==/UserScript==
if (!navigator.onLine) return;

function log(msg) {
    console.log(
        "%cnoCaptchaAi.com ~ %c" + msg,
        "background: #222; color: #bada55",
        ""
    );
}

async function getBase64FromUrl(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise(function(resolve) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener("loadend", function() {
            resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
        });
        reader.addEventListener("error", function() {
            log("❌ Failed to convert url to base64");
        });
    });
}


const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const searchParams = new URLSearchParams(location.hash);
const baseUrl = "https://free.nocaptchaai.com/api/solve";
const headers = {
    "Content-Type": "application/json",
    uid: 'UID',
    apikey: 'APIKEY'
};

(async function noCaptcha(secondTime = false) {
    const imgs = document.querySelectorAll(".task-image .image");
    const images = {};
    const target = document.querySelector(".prompt-text")?.textContent;

    console.time("noCaptchaAi.com ~ ⌛ solved in");

    if (!secondTime) {
        let temp = document.querySelector("#checkbox");
        while (!temp) {
            await sleep(500);
            temp = document.querySelector("#checkbox");
        }
        temp.click();
    }

    if (!target) {
        return log("❌ Couldn't find the target");
    }

    const start = performance.now() / 1000;
    for (let i = 0; i < imgs.length; i++) {
        const url = imgs[i].style.background.match(/url\("(.*)"/)[1];
        if (!url) break;
        images[i] = await getBase64FromUrl(url);
    }
    if (Object.keys(images).length === 0) {
        return log("❌ Couldn't find the pictures");
    }
    const end = performance.now() / 1000;
    log("☑️ converted to base64 ~ " + (end - start).toFixed(2) + "s");

    try {
        let response = await fetch(baseUrl, {
            method: "POST",
            headers,
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
            let status = await (await fetch(response.url)).json();
            while (status.status == "in queue") {
                log("🕘 waiting for response");

                await sleep(500);
                status = await (await fetch(response.url)).json();
            }
            if (status.status == "solved") {
                log("☑️ solved");
                for (const index of status.solution) {
                    imgs[index].click();
                }
            }
            console.log(response, status);
        } else if (response.status === "solved") {
            log("☑️ solved");
            for (const index of response.solution) {
                imgs[index].click();
            }
        } else {
            return alert(response.status);
        }
    } catch (error) {
        log("❌ error sending request");
    }

    log("🕓 waiting 1-2s");
    await sleep(random(1000, 2000));
    document.querySelector(".button-submit").click();
    console.timeEnd("noCaptchaAi.com ~ ⌛ solved in");
    log("☑️ verifiying");
    await sleep(1000);
    noCaptcha(true);
})();
