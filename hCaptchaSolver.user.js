// ==UserScript==
// @name         noCaptchaAI hCaptcha Solver
// @namespace    https://nocaptchaai.com
// @version      1.1.4
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @author       noCaptcha AI and Diego
// @match        https://*.hcaptcha.com/*
// @match        https://config.nocaptchaai.com/*
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @name:ru     noCaptchaAI Решатель капчи hCaptcha
// @description:ru  hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @name:sh-CN   noCaptchaAI 验证码求解器
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @inject-into  content
// @license      MIT
// ==/UserScript==
if (location.origin === "https://config.nocaptchaai.com") {
  const broadcastChannel = new BroadcastChannel("nocaptcha");
  broadcastChannel.postMessage({
    uid: GM_getValue("uid"),
    apikey: GM_getValue("apikey"),
  });
  broadcastChannel.addEventListener("message", function ({ data }) {
    console.log("Got message", data);
    GM_setValue("uid", data.uid);
    GM_setValue("apikey", data.apikey);
  });
  return;
}

GM_registerMenuCommand(
  "Open Config Webpage",
  function () {
    GM_openInTab("https://config.nocaptchaai.com");
  },
  "O"
);

if (!navigator.onLine) return;
if (!GM_getValue("uid") || !GM_getValue("apikey")) {
  if (!GM_getValue("notified")) {
    GM_openInTab(
      "https://config.nocaptchaai.com?msg=Please enter your details on the page before starting to use the userscript",
      "active"
    );
    GM_setValue("notified", true);
  }
  log("❌ uid and apikey not found");
  return;
}
// navigator.__defineGetter__('language', () => 'en');

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg) {
  console.log(
    "%cnoCaptchaAi.com ~ %c" + msg,
    "background: #222; color: #bada55",
    ""
  );
}

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

(async function noCaptcha(secondTime = false) {
  const baseUrl = "https://free.nocaptchaai.com/api/solve",
    searchParams = new URLSearchParams(location.hash),
    images = {};

  console.time("noCaptchaAi.com ~ ⌛ solved in");
  if (!secondTime) {
    await sleep(1000);
    document.querySelector("#checkbox")?.click();
    await sleep(2000);
  }

  const imgs = document.querySelectorAll(".task-image .image"),
    target = document.querySelector(".prompt-text")?.textContent;
  // const images = {...[...imgs].map(ele => ele.style.background.match(/url\("(.*)"/)[1] || 0)};
  // const images = await [...imgs].reduce(async function(acc, element, index) {
  //     const url = element.style.background.match(/url\("(.*)"/)[1]
  //     if (!url) return;
  //     return { [index]: await getBase64FromUrl(url), ...acc };
  // }, {})
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

  // if script not working with your language, use code below commented
  // let frameLang = document.querySelector(
  //   "body > div.challenge-interface > div.language-selector > div.display-language.button > div"
  // );
  // console.log(frameLang.innerHTML.toLowerCase());
  // console.log(navigator.language);

  try {
    let response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        uid: GM_getValue("uid"),
        apikey: GM_getValue("apikey"),
      },
      body: JSON.stringify({
        images,
        target: document.querySelector(".prompt-text").textContent,
        method: "hcaptcha_base64",
        sitekey: searchParams.get("sitekey"),
        site: searchParams.get("host"),
        ln: document.documentElement.lang,
        softid: "UserScript",
      }),
    });
    response = await response.json();

    if (response.status == "new") {
      await sleep(2000);
      let status = await (await fetch(response.url)).json();
      if (status.status == "in queue") {
        log("🕘 waiting for response");
        await sleep(2000);
        status = await (await fetch(response.url)).json();
      }
      if (status.status == "solved") {
        log("☑️ solved");
        for (const index of status.solution) {
          imgs[index].click();
          await sleep(200);
        }
      }
      console.log(response, status);
    } else if (response.status === "solved") {
      log("☑️ solved");
      for (const index of response.solution) {
        imgs[index].click();
        await sleep(random(280, 350));
      }
    } else {
//       return alert(response.status);
//       document.querySelector(".button-submit").click();
    }
  } catch (error) {
    log("❌ error sending request");
  }

  log("🕓 waiting 2-3s");
  await sleep(random(2000, 3000));
  document.querySelector(".button-submit").click();
  console.timeEnd("noCaptchaAi.com ~ ⌛ solved in");
  log("☑️ verifiying");
  await sleep(1000);
  noCaptcha(true);
})();
