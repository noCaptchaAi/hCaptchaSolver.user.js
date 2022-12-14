// ==UserScript==
// @name         hCaptcha Captcha Solver by noCaptchaAi
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.2.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        *://*/*
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @require      https://greasyfork.org/scripts/395037-monkeyconfig-modern/code/MonkeyConfig%20Modern.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @resource html https://github.com/noCaptchaAi/hCaptchaSolver.user.js/blob/main/index.html
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_addElement
// @license      MIT
// ==/UserScript==
let startTime;

const base = "https://free.nocaptchaai.com/api/";
const balUrl = base + "account/balance";
const baseUrl = base + "solve";

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 8000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
});

const cfg = new MonkeyConfig({
    title: "⚙️noCaptchaAi.com All Settings",
    menuCommand: true,
    displayed: true,
    overlay: true,
    openLayer: true,
    params: {
        UID: {
            type: "text",
            default: "",
        },
        APIKEY: {
            type: "text",
            default: "",
        },
        auto_solve: {
            type: "checkbox",
            default: true,
        },
        checkbox_auto_open: {
            type: "checkbox",
            default: true,
        },
        delay_before_checkbox_open: {
            type: "number",
            default: 1000,
        },
        image_click_RandMin: {
            type: "number",
            default: 250,
        },
        image_click_RandMax: {
            type: "number",
            default: 450,
        },
        solve_puzzle_within_RandMin: {
            type: "number",
            default: 4000,
        },
        solve_puzzle_within_RandMax: {
            type: "number",
            default: 5500,
        },
        loop_run_interval: {
            type: "number",
            default: 1000,
        }
    },
});

let unauth = !new Boolean(cfg.get("UID") && cfg.get("APIKEY"));
console.log(unauth);
const headers = {
    "Content-Type": "application/json",
    uid: cfg.get("UID"),
    apikey: cfg.get("APIKEY"),
}

log(
    "auto open= " +
    cfg.get("checkbox_auto_open") +
    " | " +
    "auto solve= " +
    cfg.get("auto_solve") +
    " | " +
    "loop running in bg"
);

if (!unauth) {
    GM_registerMenuCommand("👛 Check Balance", async function() {
        log(cfg.get("UID") + cfg.get("APIKEY"));
        let response = await fetch(balUrl, {
            headers
        })
        const baljson = JSON.stringify(await response.text(), null, "\t");
        if (response.status === "Unauthorized") {
            Toaster(
                "error",
                "<b>noCaptchaAi.com ~</b><i> Balance:-</i>",
                baljson
            );
            await sleep(2000);
            return cfg.open("layer");
        }
        Toaster(
            "success",
            "<b>noCaptchaAi.com ~</b><i> Balance:-</i>",
            baljson
        );
    })
} else if (document.querySelector('#warning')) {
    const div = document.createElement('div');
    div.onclick = function(e) {
        e.preventDefault();
        cfg.open('window', {
            windowFeatures: {
                width: 500
            }
        });
    }
    div.style = "color: rgb(235, 87, 87); font-size: 10px; bottom: 5px; left: 5px; width: 75%; position: absolute;";
    div.innerHTML = '<code>apikey</code> or <code>uid</code> not set. Click here to set up';
    document.querySelector('#warning').insertAdjacentElement('afterEnd', div);
}

GM_registerMenuCommand("🏠 HomePage", function() {
    GM_openInTab("https://nocaptchaai.com", {
        active: true,
        setParent: true
    });
});
GM_registerMenuCommand("📈 Dashboard", function() {
    GM_openInTab("https://dash.nocaptchaai.com", {
        active: true,
        setParent: true
    });
});
GM_registerMenuCommand("💸 Buy Solving Quota", function() {
    GM_openInTab("https://nocaptchaai.com/buy.html", {
        active: true,
        setParent: true
    });
});
GM_registerMenuCommand("📄 Api Docs", function() {
    GM_openInTab("https://docs.nocaptchaai.com/category/api-methods", {
        active: true,
        setParent: true
    });
});
GM_registerMenuCommand("📄 Github", function() {
    GM_openInTab("https://github.com/shimuldn/hCaptchaSolverApi", {
        active: true,
        setParent: true
    });
});
GM_registerMenuCommand("❓ Discord", function() {
    GM_openInTab("https://discord.gg/E7FfzhZqzA", {
        active: true,
        setParent: true
    });
});
GM_registerMenuCommand("❓ Telegram", function() {
    GM_openInTab("https://t.me/noCaptchaAi", {
        active: true,
        setParent: true
    });
});

console.log("Run done");
while (true) {
    if (!navigator.onLine || unauth) break;

    await sleep(cfg.get("loop_run_interval"));

    if (cfg.get("checkbox_auto_open") && isWidget()) {
        const isSolved = document.querySelector("div.check")?.style.display === "block";
        if (isSolved) break;
        await sleep(cfg.get("delay_before_checkbox_open"));
        document.querySelector("#checkbox")?.click();
    } else if (cfg.get("auto_solve") && document.querySelector("h2.prompt-text") !== null) {
        await solve();
    }
}

function isWidget() {
    const rect = document.body.getBoundingClientRect();
    if (rect?.width === 0 || rect?.height === 0) {
        return false;
    }
    return document.querySelector("div.check") !== null;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randTimer(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function log(msg) {
    console.log(
        "%cnoCaptchaAi.com ~ %c" + msg,
        "background: #222; color: #bada55",
        ""
    );
}

function Toaster(status, text, response) {
    Toast.fire({
        icon: status,
        title: text + "\n" + response,
        timer: 10000,
        width: "38em",
        timerProgressBar: true,
        allowOutsideClick: "true",
        color: "#222",
        grow: "row",
        background: "#fff",
        padding: "4em",
        backdrop: true,
        showCloseButton: true,
    });
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

async function solve() {
    const {
        target,
        cells,
        images
    } = await on_task_ready();

    if (!cfg.get("auto_solve")) {
        return;
    }
    startTime = new Date();

    const searchParams = new URLSearchParams(location.hash);

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
            }),
        });

        response = await response.json();
        log("🕘 waiting for response");

        if (response.status === "new") {
            log("waiting 2s");
            await sleep(2000);
            const status = await (await fetch(response.url)).json();
            for (const index of status.solution) {
                cells[index].click();
            }
        } else if (response.status === "solved") {
            console.log("noCaptchaAi.com ~ ☑️ server procssed in", response.processing_time);
            log("🖱️ -> 🖼️");
            const randmin = parseInt(cfg.get("image_click_RandMin"));
            const randmax = parseInt(cfg.get("image_click_RandMax"));
            for (const index of response.solution) {
                cells[index].click();
                await sleep(randTimer(randmin, randmax));
            }
        } else if (response.status === "Unauthorized") {
            unauth = true;
            Toaster("error", "noCaptchaAi.com Apikey or uid not valid", response);
            await sleep(2000);
            cfg.open("window");
            return log(response.status, response.message)
        } else {
            return log(response.status);
        }

        let randmin = parseInt(cfg.get("solve_puzzle_within_RandMin"));
        let randmax = parseInt(cfg.get("solve_puzzle_within_RandMax"));
        // console.log(randTimer(randmin, randmax));
        // console.log("rand", typeof randmax, randmax, randmin);

        const elapsedTime = new Date() - startTime;
        // console.log("elapsed", elapsedTime);
        // TODO
        const remainingTime = randTimer(randmin, randmax) - elapsedTime;
        // console.log("remaining", remainingTime);
        await sleep(remainingTime);

        // await sleep(cfg.get("delay_before_submit"));
        log("☑️ sent!");
        document.querySelector(".button-submit").click();
        startTime = 0;
    } catch (error) {
        console.error(error);
    }
}

function on_task_ready(i = 500) {
    return new Promise(async (resolve) => {
        const check_interval = setInterval(async function() {
            let target = document.querySelector(".prompt-text")?.textContent;
            if (!target) return;

            const cells = document.querySelectorAll(".task-image .image");
            if (cells.length !== 9) return;

            const images = {};
            for (let i = 0; i < cells.length; i++) {
                const img = cells[i];
                if (!img) return;
                const url = img.style.background.match(/url\("(.*)"/)?.at(1) || null;
                if (!url || url === "") return;
                images[i] = await getBase64FromUrl(url);
            }

            clearInterval(check_interval);
            return resolve({
                target,
                cells,
                images
            });
        }, i);
    });
}
