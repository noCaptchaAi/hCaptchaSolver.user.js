// ==UserScript==
// @name         hCaptcha Solver by noCaptchaAi BETA
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.8.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        https://newassets.hcaptcha.com/captcha/*
// @match        https://config.nocaptchaai.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nocaptchaai.com
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolverBeta.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolverBeta.user.js
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_listValues
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==
const proBalApi = "https://manage.nocaptchaai.com/balance";
const searchParams = new URLSearchParams(location.hash);
const open = XMLHttpRequest.prototype.open;
const Toast = Swal.mixin({
    position: "top-end",
    showConfirmButton: false,
    timer: 1000
})
const cfg = new config({
    APIKEY: {
        label: "apikey",
        default: "",
    },
    PLAN: {
        label: "plan",
        default: "free",
    },
    DELAY: {
        label: "Delay Timer",
        default: 4,
    },
    AUTO_SOLVE: {
        label: "Auto Solve",
        default: true,
    },
    CHECKBOX_AUTO_OPEN: {
        label: "Auto Open",
        default: true,
    },
    LOOP: {
        label: "loop",
        default: false,
    },
    DEBUG_LOGS: {
        label: "Debug Logs",
        default: true,
    }
});
const isApikeyEmpty = !cfg.get("APIKEY");
const headers = {
    "Content-Type": "application/json",
    apikey: cfg.get("APIKEY"),
};

let target, error, copy;

XMLHttpRequest.prototype.open = function() {
    this.addEventListener("readystatechange", async function() {
        if(isApikeyEmpty || !cfg.get("AUTO_SOLVE") ||  this.responseType === "arraybuffer" || !this.responseText) {
            return;
        }

        if(!this.responseURL.startsWith("https://hcaptcha.com/getcaptcha/")) {
            return;
        }

        try {
            const data = JSON.parse(this.responseText);
            if(target === data.requester_question?.en || data.success === false) {
                return;
            }
            target = data.requester_question?.en;
            const options = {
                method: "POST",
                headers,
                body: {
                    images: {},
                    target,
                    method: "hcaptcha_base64",
                    sitekey: searchParams.get("sitekey"),
                    site: searchParams.get("host"),
                    softid: "UserScript" + GM_info.script.version,
                }
            };
            if (data.request_type === "image_label_multiple_choice") {
                options.body.type = "desc";
                // options.body.example = await getBase64FromUrl(data.requester_question_example);
                options.body.example = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
                options.body.choices = Object.keys(data.requester_restricted_answer_set);
            }

            for(let i = 0; i < data.tasklist.length; i++) {
                options.body.images[i] = await getBase64FromUrl(data.tasklist[i].datapoint_uri);
            }

            copy = options.body.images;
            options.body = JSON.stringify(options.body);
            await solve(options, data.request_type);

        } catch (e) {
            log("error", e, this);
        }
    });
    open.apply(this, arguments);

}

addMenu("⚙️ Settings", cfg.open, !isApikeyEmpty);
addMenu(isApikeyEmpty ? "Login" : "📈 Dashboard/ 💰 Buy Plan / 👛 Balance info", "https://dash.nocaptchaai.com")
addMenu("🏠 HomePage", "https://nocaptchaai.com");
addMenu("📄 Api Docs", "https://docs.nocaptchaai.com/category/api-methods");
addMenu("❓ Discord", "https://discord.gg/E7FfzhZqzA");
addMenu("❓ Telegram", "https://t.me/noCaptchaAi");

if(is("checkbox")) {
    log("loop running in bg");

    GM_addValueChangeListener("APIKEY", function(key, oldValue, newValue, remote) {
        log("The value of the '" + key + "' key has changed from '" + oldValue + "' to '" + newValue + "'");
        log(location.href);
        location = location.href;
    });

}

if(location.hostname === "config.nocaptchaai.com") {

    const sp = new URLSearchParams(location.search); //temp

    if(sp.has("apikey") && sp.has("plan") && document.referrer === "https://dash.nocaptchaai.com/") {
        cfg.set("APIKEY", sp.get("apikey"));
        cfg.set("PLAN", sp.get("plan"));
        Toast.fire({
            title: "noCaptchaAi.com \n Config Saved Successfully."
        });
        history.replaceState({}, document.title, "/");
    }
    const template = document.getElementById("tampermonkey");
    const clone = template.content.cloneNode(true);
    const inputs = clone.querySelectorAll("input");
    const wallet = clone.getElementById("WALLET");
    const url = cfg.get("PLAN") === "PRO" ? proBalApi : getApi("balance");
    const response = await fetch(url, {
        headers
    });
    const data = await response.json();
    log(data);
    wallet.innerText = `Wallet: ${data.user_id}, 💲${data.Balance}`

    for(const input of inputs) {
        const type = input.type === "checkbox" ? "checked" : "value";
        input[type] = cfg.get(input.id);
        input.addEventListener("change", function(e) {
            Toast.fire({
                title: "Your change has been saved"
            });
            cfg.set(input.id, e.target[type])
        })
    }

    document.querySelector("h1").after(clone);

}

while(!(!navigator.onLine || isApikeyEmpty)) {

    await sleep(1000)

    if(cfg.get("CHECKBOX_AUTO_OPEN") && is("checkbox")) {
        const isSolved = document.querySelector("div.check")?.style.display === "block";
        if(isSolved && !cfg.get("LOOP")) {
            log("found solved");
            break;
        }
        fireMouseEvents(document.querySelector("#checkbox"))
    } else if(cfg.get("AUTO_SOLVE") && is("challange")) {
        log("opening box");
        await solve();
    }
}

async function solve(options, label) {
    const start_time = Date.now();
    try {
        const response = await fetch(getApi("solve"), options);
        log("sent for solving", "🕘 waiting for response");
        let data = await response.json();

        if(data.status === "new") {
            log("⏳ waiting a second");
            await sleep(1000);
            data = await (await fetch(data.url)).json();
        } else if (data.status === "solved") {
        } else if (data.status === "skip") {
            log("😨 Seems this a new challenge, please contact noCaptchaAi!");
        } else if (data.status === "error") {
            log("😨 Error", data);
        } else if (data.message === "restricted") {
            error = "<h3>Account flagged</h3> <h4>a) Buy Plan</h4> <h4>b) Ping on Discord/Telegram for activation</h4>";
        } else if (data.message === "Invalid apikey") {
            error = "noCaptchaAi.com Apikey not valid.";
        } else {
            return log("😨 Unknown status", response.status);
        }
        //todo handle error
        if (error) {
            return;
        }
        const delay = parseInt(cfg.get("DELAY")) * 1000;
        const wait = delay - (Date.now() - start_time)
        log(wait, delay);
        if(wait > 0) {
            await sleep(wait)
        }
        return (label === "image_label_binary" ? binary : multiple)(data)//, start_time);
    } catch (error) {
        log(error);
    }
}

async function getBase64FromUrl(url) {
    const blob = await (await fetch(url)).blob();
    return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener("loadend", function() {
            resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
        });
        reader.addEventListener("error", function() {
            reject("❌ Failed to convert url to base64");
        });
    });
}
async function binary(data) {
    let solutions = data.solution;
    const finger = solutions.findIndex(index => index >= 8);
    const start = solutions.slice(0, finger);
    const end = solutions.slice(finger);
    if (start.length > 0) {
        solutions = start;
    }
    const cells = document.querySelectorAll(".task-image .image");
    for (const index of solutions) {
        const math = index % 8;
        fireMouseEvents(cells[math]);
    }
    //need to fix
    // if (end.length > 0) {
    //     return binary({solution: end});
    // }
    log("☑️ sent!");
    fireMouseEvents(document.querySelector(".button-submit"));
}
async function multiple(data) {
    //need to be test
    log(data, copy);
    const image = document.querySelector('.image')?.style.backgroundImage.replace(/url\("|"\)/g, "");
    const base64 = await getBase64FromUrl(image);
    const finger = Object.values(copy).indexOf(base64);
    const answer = data.answer?.at(finger);
    if (!answer) {
        return;
    }
    const element = [...document.querySelectorAll(".answer-text")].find(element => element.textContent === answer)
    fireMouseEvents(element);
    fireMouseEvents(document.querySelector(".button-submit"))
    multiple();
    //     await sleep(500);
}

function fireMouseEvents(element) {
    if(!document.contains(element)) {
        return;
    }
    ["mouseover", "mousedown", "mouseup", "click"].forEach(eventName => {
        if(element.fireEvent) {
            element.fireEvent("on" + eventName);
        } else {
            const eventObject = document.createEvent("MouseEvents");
            eventObject.initEvent(eventName, true, false);
            element.dispatchEvent(eventObject);
        }
    });
}
function config(data) {
    let openWin;

    function get(name) {
        return GM_getValue(name, "")
    }

    function set(name, value) {
        GM_setValue(name, value);
        // if (data.onSave) {
        //     data.onSave(name, value)
        // }
    }

    function open() {
        const windowFeatures = {
            location: "no",
            status: "no",
            left: window.screenX,
            top: window.screenY,
            width: 500,
            height: 500
        };

        const featuresArray = Object.keys(windowFeatures).map(key => key + "=" + windowFeatures[key]);

        openWin = window.open("https://config.nocaptchaai.com/", "_blank", featuresArray.join(","));
        openWin.moveBy(Math.round((window.outerWidth - openWin.outerWidth) / 2), Math.round((window.outerHeight - openWin.outerHeight) / 2));
        window.addEventListener("beforeunload", openWin?.close);
    }

    function close() {
        openWin?.close();
        openWin = undefined;
    }

    const storedKeys = GM_listValues();

    for(const name in data) {
        if(storedKeys.includes(name)) {
            set(name, get(name));
        } else if(data[name].default !== undefined) {
            set(name, data[name].default);
        } else {
            set(name, "");
        }
    }
    return { get, set, open, close };
}
function getApi(v) {
    return "https://" + cfg.get("PLAN") + ".nocaptchaai.com/" + v;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function is(frame) {
    if(searchParams.has("#frame")) {
        return frame === searchParams.get("#frame");
    }
    const selector = frame === "checkbox" ? "div.check" : "h2.prompt-text";
    return document.contains(document.querySelector(selector))
}
function log() {
    if(!cfg.get("DEBUG_LOGS")) {
        return;
    }
    for(const arg of arguments) {
        console.debug(arg);
    }
}

function addMenu(name, url, check = true) {
    if(!check) {
        return;
    }

    GM_registerMenuCommand(name, function() {
        if(typeof url === "function") {
            url();
        } else {
            GM_openInTab(url, {
                active: true,
                setParent: true
            });
        }
    });
}
