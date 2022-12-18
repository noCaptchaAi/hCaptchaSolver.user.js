// ==UserScript==
// @name         hCaptcha Captcha Solver by noCaptchaAi
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.3.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        *://*/*
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @require      https://greasyfork.org/scripts/395037-monkeyconfig-modern/code/MonkeyConfig%20Modern.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_addElement
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==
const base = "https://free.nocaptchaai.com/api/";
const balUrl = base + "account/balance";
const baseUrl = base + "solve";

const Toast = Swal.mixin({
    toast: true,
    showConfirmButton: false,
    showCloseButton: true,
    timerProgressBar: true,
    timer: 6000,
    position: "top-end",
    width: "90%",
    color: "#222",
    target: "body",
    background: "#fff",
    padding: "4em",
    didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
});

const cfg = new MonkeyConfig({
    title: "⚙️noCaptchaAi Settings",
    menuCommand: true,
    params: {
        UID: {
            type: "text",
            label: "uid",
            default: "",
        },
        APIKEY: {
            type: "text",
            label: "apikey",
            default: "",
        },
        AUTO_SOLVE: {
            type: "checkbox",
            label: "auto solve",
            default: true,
        },
        CHECKBOX_AUTO_OPEN: {
            type: "checkbox",
            label: "checkbox auto open",
            default: true,
        },
        DELAY_BEFORE_CHECKBOX_OPEN: {
            type: "number",
            label: "delay before checkbox open",
            default: 200,
        },
        SOLVE_IN_SEC: {
            type: "number",
            label: 'solve in sec (can\'t be less than 3 sec)',
            default: 3
        },
        DEBUG_LOGS: {
            type: "checkbox",
            label: "debug logs",
            default: true,
        },
    },
});

let stop = false;
const headers = {
    "Content-Type": "application/json",
    uid: cfg.get("UID"),
    apikey: cfg.get("APIKEY"),
};

if (window.top === window) {
    log("auto open= " + cfg.get("CHECKBOX_AUTO_OPEN"), "auto solve= " + cfg.get("AUTO_SOLVE"), "loop running in bg");
}

GM_registerMenuCommand("🏠 HomePage", function() {
    GM_openInTab("https://nocaptchaai.com", {
        active: true,
        setParent: true,
    });
});
GM_registerMenuCommand("📈 Dashboard", function() {
    GM_openInTab("https://dash.nocaptchaai.com", {
        active: true,
        setParent: true,
    });
});
GM_registerMenuCommand("💸 Buy Solving Quota", function() {
    GM_openInTab("https://nocaptchaai.com/buy.html", {
        active: true,
        setParent: true,
    });
});
GM_registerMenuCommand("📄 Api Docs", function() {
    GM_openInTab("https://docs.nocaptchaai.com/category/api-methods", {
        active: true,
        setParent: true,
    });
});
GM_registerMenuCommand("📄 Github", function() {
    GM_openInTab("https://github.com/shimuldn/hCaptchaSolverApi", {
        active: true,
        setParent: true,
    });
});
GM_registerMenuCommand("❓ Discord", function() {
    GM_openInTab("https://discord.gg/E7FfzhZqzA", {
        active: true,
        setParent: true,
    });
});
GM_registerMenuCommand("❓ Telegram", function() {
    GM_openInTab("https://t.me/noCaptchaAi", {
        active: true,
        setParent: true,
    });
});

while (true) {
    if (!navigator.onLine || stop) break;

    await sleep(1000)

    if (cfg.get("CHECKBOX_AUTO_OPEN") && isWidget()) {
        const isSolved = document.querySelector("div.check")?.style.display === "block";
        if (isSolved) {
            log("found solved");
            break;
        }
        await sleep(cfg.get("DELAY_BEFORE_CHECKBOX_OPEN"));
        document.querySelector("#checkbox")?.click();
    } else if (cfg.get("AUTO_SOLVE") && document.querySelector("h2.prompt-text") !== null) {
        await solve();
    }
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
    const {target, cells, images} = await on_task_ready();

    if (!cfg.get("AUTO_SOLVE")) {
        return;
    }
    const start_time = Date.now();
    const searchParams = new URLSearchParams(location.hash);

    try {
        const response = await fetch(baseUrl, {
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
        const data = await response.json();

        if (data.status === "new") {
            await sleep(2000);
            const status = await (await fetch(data.url)).json();
            for (const index of status.solution) {
                cells[index].click();
            }
        } else if (data.status === "solved") {
            for (const index of data.solution) {
                cells[index].click();
                await sleep(200);
            }
        } else if (data.status === "Unauthorized") {
            stop = true;
            Toast.fire({
                icon: "error",
                title: "noCaptchaAi.com Apikey or uid not valid. \n Popup window will open, if blocked enable and refresh"
            }).then(function() {
                cfg.open("window", {
                    windowFeatures: {
                        width: 500
                    },
                });
            })
            return log(response.status, response.message);
        } else {
            return log(response.status);
        }

        let delay = parseInt(cfg.get('SOLVE_IN_SEC'));
        delay = (delay > 3 ? delay : 3) * 1000;

        const d = delay - (Date.now() - start_time)
        log(d, delay);
        if (d > 0) {
            await sleep(d)
        }
        document.querySelector(".button-submit").click();
    } catch (error) {
        log(error);
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
            return resolve({target, cells, images});
        }, i);
    });
}

function log(...args) {
    if (!cfg.get('DEBUG_LOGS')) return;
    console.debug(args.join('\n'))
}
