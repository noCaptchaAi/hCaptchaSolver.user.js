// ==UserScript==
// @name         hCaptcha Captcha Solver by noCaptchaAi
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      2.1.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        *://*/*
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @require      https://greasyfork.org/scripts/395037-monkeyconfig-modern/code/MonkeyConfig%20Modern.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/awesome-notifications/3.1.0/index.var.min.js
// @resource     IMPORTED_CSS https://cdnjs.cloudflare.com/ajax/libs/awesome-notifications/3.1.0/style.min.css
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

let notifier = new AWN();

try {
  localStorage.getItem("apikeymissing", "yes");
} catch (error) {
  localStorage.setItem("apikeymissing", "undefined");
}

const baseUrl = "https://free.nocaptchaai.com/api/solve";

// tampermonkey menu
const cfg = new MonkeyConfig({
  title: "noCaptchaAi.com api solving settings",
  menuCommand: true,
  displayed: true,
  //   overlay: true,
  //   openLayer: true,
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
      default: false,
    },
    delay_before_checkbox_open: {
      type: "number",
      default: "1000",
    },
    delay_before_final_submit: {
      type: "number",
      default: "5000",
    },
    delay_between_image_clicking_min: {
      type: "number",
      default: "250",
    },
    delay_between_image_clicking_max: {
      type: "number",
      default: "450",
    },
  },
});

// type of capctha frame
function isWidget() {
  if (
    document.body.getBoundingClientRect()?.width === 0 ||
    document.body.getBoundingClientRect()?.height === 0
  ) {
    return false;
  }
  return document.querySelector("div.check") !== null;
}

// config log

function notif() {
  if (
    cfg.get("APIKEY").length === 0 &&
    localStorage.getItem("apikeymissing") != "yes"
  ) {
    let onOk = () => {
      notifier.info("noCaptchaAi.com APIKEY Missing");
    };
    let onCancel = () => {
      notifier.info("visit instructions -> https://config.noCaptchaAi.com");
    };
    notifier.confirm("ok?", onOk, onCancel, {
      labels: {
        confirm: "setup noCaptchaAi APIKEY on menu",
      },
    });
  }
}
// sleep timer
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function random(min, max) {
  min = cfg.get("delay_between_image_clicking_min");
  max = cfg.get("delay_between_image_clicking_max");
  return Math.floor(Math.random() * (max - min) + min);
}

function log(msg) {
  console.log(
    "%cnoCaptchaAi.com ~ %c" + msg,
    "background: #222; color: #bada55",
    ""
  );
}

function on_task_ready(i = 500) {
  return new Promise(async (resolve) => {
    const check_interval = setInterval(async function () {
      let target = document.querySelector(".prompt-text")?.textContent;
      if (!target) return;

      const cells = document.querySelectorAll(".task-image .image");
      if (cells.length !== 9) return;

      const images = {};
      for (let i = 0; i < cells.length; i++) {
        const img = cells[i];
        if (!img) return;
        const url = img.style.background.match(/url\("(.*)"/).at(1) || null;
        if (!url || url === "") return;
        images[i] = await getBase64FromUrl(url);
      }

      clearInterval(check_interval);
      return resolve({ target, cells, images });
    }, i);
  });
}

// base64 getter
async function getBase64FromUrl(url) {
  const blob = await (await fetch(url)).blob();
  return new Promise(function (resolve) {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.addEventListener("loadend", function () {
      resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
    });
    reader.addEventListener("error", function () {
      log("❌ Failed to convert url to base64");
    });
  });
}

// solver
async function solve() {
  const { target, cells, images } = await on_task_ready();
  //   log(target, cells, images);
  if (!cfg.get("auto_solve")) {
    return;
  }
  const searchParams = new URLSearchParams(location.hash);

  try {
    let response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        uid: cfg.get("UID"),
        apikey: cfg.get("APIKEY"),
      },
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
    log("🕘 waiting for 📨");

    response = await response.json();

    if (response.status === "new") {
      log("waiting 2s");
      await sleep(2000);
      const status = await (await fetch(response.url)).json();
      for (const index of status.solution) {
        cells[index].click();
      }
    } else if (response.status === "solved") {
      log("☑️ -> 🖱️ -> 🖼️");
      for (const index of response.solution) {
        cells[index].click();
        await sleep(random(cfg, 450));
      }
    } else if (response.status === "Unauthorized") {
      notif();
      window.confirm("noCaptchaAi ~ Check APIKEY or UID is incorrect");
      return log(response.status, response.message);
    } else {
      return log(response.status);
    }

    await sleep(cfg.get("delay_before_final_submit"));
    log("☑️ sent!");
    document.querySelector(".button-submit").click();
  } catch (error) {
    console.error(error);
  }
}

// looper

(async () => {
  while (true) {
    if (!navigator.onLine) break;
    if (
      cfg.get("APIKEY").length === 0 &&
      localStorage.getItem("apikeymissing") !== "yes"
    ) {
      if (
        window.confirm(
          "nocaptchaai.com Apikey Missing.Cancel to set on tampermonkey menu. Click OK to view instructions"
        )
      ) {
        window.open("http://config.nocaptchaai.com/");
      }
      notif();

      localStorage.setItem("apikeymissing", "yes");

      break;
    }

    await sleep(cfg.get("delay_before_checkbox_open"));

    if (cfg.get("checkbox_auto_open") && isWidget()) {
      const isSolved =
        document.querySelector("div.check")?.style.display === "block";
      if (isSolved) break;
      await sleep(500);
      document.querySelector("#checkbox")?.click();
    } else if (
      cfg.get("auto_solve") &&
      document.querySelector("h2.prompt-text") !== null
    ) {
      await solve();
    }
  }
})();
