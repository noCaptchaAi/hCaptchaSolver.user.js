// ==UserScript==
// @name         hCaptcha Captcha Solver by noCaptchaAi
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.6.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @description:ar تجاوز برنامج Captcha Solver الآلي لخدمة hCaptcha Solver خدمة Ai. 6000 🔥 حل / شهر مجاني! 50x⚡ أسرع من 2Captcha وغيرها
// @description:ru hCaptcha Solver автоматизирует решение Captcha Solver в обход сервиса Ai. Бесплатно 6000 🔥решений/месяц! В 50 раз⚡ быстрее, чем 2Captcha и другие
// @description:zh-CN hCaptcha Solver 自动绕过 Ai 服务的 Captcha Solver。 免费 6000 🔥解决/月！ 比 2Captcha 和其他人快 50x⚡
// @author       noCaptcha AI and Diego
// @match        *://*/*
// @match        https://config.nocaptchaai.com/?apikey=*
// @icon         https://docs.nocaptchaai.com/img/nocaptchaai.com.png
// @require      https://greasyfork.org/scripts/395037-monkeyconfig-modern/code/MonkeyConfig%20Modern.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @updateURL    https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @downloadURL  https://github.com/noCaptchaAi/hCaptchaSolver.user.js/raw/main/hCaptchaSolver.user.js
// @grant        GM_info
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_addElement
// @license      MIT
// ==/UserScript==

(async () => {
  "use strict";

  const cfg = new MonkeyConfig({
    title: "⚙️noCaptchaAi.com All Settings",
    params: {
      auto_solve: {
        type: "checkbox",
        default: true,
      },
      checkbox_auto_open: {
        type: "checkbox",
        default: true,
      },
      debug_logs: {
        type: "checkbox",
        label: "Enable logs",
        default: true,
      },
      APIKEY: {
        type: "text",
        default: "",
      },
      PLAN: {
        type: "select",
        label: "noCaptchaAi Plan",
        choices: ["FREE", "PRO"],
        default: "FREE",
      },
      Custom_Endpoint: {
        type: "text",
        label: "Custom API URL (OPTIONAL)",
        default: "",
      },
      delay_before_checkbox_open: {
        type: "number",
        label: "checkbox open (ms)",
        default: 200,
      },
      image_click_RandMin: {
        type: "number",
        label: "img click max (ms)",
        default: 150,
      },
      image_click_RandMax: {
        type: "number",
        label: "img click min (ms)",
        default: 250,
      },
      solve_puzzle_within_RandMin: {
        type: "number",
        label: "solve within min (ms)",
        default: 5000,
      },
      solve_puzzle_within_RandMax: {
        type: "number",
        label: "solve within max (ms)",
        default: 6000,
      },
      loop_run_interval: {
        type: "number",
        label: "loop run interval (ms)",
        default: 1000,
      },
    },
    onSave,
    menuCommand: true,
  });

  let startTime;
  let stop = false;
  const v = GM_info.script.version;

  const freeApi = "https://free.nocaptchaai.com/api/";
  const freeBalApi = freeApi + "user/free_balance";
  const proBalApi = "https://manage.nocaptchaai.com/api/user/get_balance";

  let isApikeyEmpty = !cfg.get("APIKEY");

  function log(msg) {
    console.log(
      "%cnoCaptchaAi.com ~ %c" + msg,
      "background: #222; color: #bada55",
      ""
    );
  }
  (() => {
    GM_addStyle(
      `.swal2-container{
         z-index:9990; }
      `
    );
  })();

  const Toast = Swal.mixin({
    toast: true,
    position: "top-center",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 8000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  if (location.search.startsWith("?apikey=")) {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
    let apikey = params.apikey;
    let plan = params.plan;
    let custom_api = params.custom_api;

    if (
      apikey !== undefined ||
      "" ||
      plan !== undefined ||
      "" ||
      custom_api !== undefined ||
      ""
    ) {
      cfg.set("APIKEY", apikey);
      cfg.set("PLAN", plan);
      cfg.set("Custom_Endpoint", custom_api);
      await sleep(1000);
      cfg.open();
      await sleep(1000);
      if (document.getElementById("__MonkeyConfig_frame")) {
        let iframe = document.getElementById("__MonkeyConfig_frame");
        let innerDoc = iframe.contentDocument || iframe.contentWindow.document;
        innerDoc.getElementById("__MonkeyConfig_button_save")?.click();
        console.log(iframe);
        console.log(innerDoc);
      }
      await sleep(1000);

      if (cfg.get("APIKEY").length != 0 && cfg.get("PLAN").length != 0) {
        Toast.fire(
          "noCaptchaAi.com \n Config Saved Successfully. \n Refresh captcha pages to solve."
        );
      }
    }
  }

  if (window.top === window) {
    //log(!cfg.get("APIKEY"));
    log(
      "auto open= " + cfg.get("CHECKBOX_AUTO_OPEN"),
      "auto solve= " + cfg.get("AUTO_SOLVE"),
      "loop running in bg"
    );
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: cfg.get("APIKEY"),
  };

  log(
    "auto open= " +
      cfg.get("checkbox_auto_open") +
      " | " +
      "auto solve= " +
      cfg.get("auto_solve") +
      " | " +
      "loop running in bg"
  );

  if (!isApikeyEmpty) {
    GM_registerMenuCommand("💲 Check Balance fetch", async function () {
      let response = await fetch(
        cfg.get("Custom_Endpoint").length === 0 && cfg.get("PLAN") === "FREE"
          ? freeBalApi
          : proBalApi,
        {
          headers,
        }
      );
      const baljson = JSON.stringify(await response.json(), null, "\t");
      if (response.status === "Unauthorized") {
        Toaster("error", "<b>noCaptchaAi.com ~</b><i> Balance:-</i>", baljson);
        await sleep(2000);
        return cfg.open("layer");
      }
      Toaster("success", "<b>noCaptchaAi.com ~</b><i> Balance:-</i>", baljson);
    });

    GM_registerMenuCommand("💲 Check Balance xmlHttp ", function () {
      GM_xmlhttpRequest({
        method: "GET",
        headers,
        url:
          cfg.get("Custom_Endpoint").length === 0 && cfg.get("PLAN") === "FREE"
            ? freeBalApi
            : proBalApi,
        onload: function (response) {
          log(response.responseText);
          log(response.status === 200);
          if (response) {
            Toaster(
              "success",
              "<b>noCaptchaAi.com ~</b><i> Balance:-</i>",
              response.responseText
            );
          }
        },
      });
    });
  }

  GM_registerMenuCommand("🏠 HomePage", function () {
    GM_openInTab("https://nocaptchaai.com", {
      active: true,
      setParent: true,
    });
  });

  GM_registerMenuCommand(
    "📈 Dashboard /💰 Buy Solves /💲 Balance",
    function () {
      GM_openInTab("https://dash.nocaptchaai.com", {
        active: true,
        setParent: true,
      });
    }
  );
  GM_registerMenuCommand("📄 Api Docs", function () {
    GM_openInTab("https://docs.nocaptchaai.com/category/api-methods", {
      active: true,
      setParent: true,
    });
  });
  GM_registerMenuCommand("❓ Discord", function () {
    GM_openInTab("https://discord.gg/E7FfzhZqzA", {
      active: true,
      setParent: true,
    });
  });
  GM_registerMenuCommand("❓ Telegram", function () {
    GM_openInTab("https://t.me/noCaptchaAi", {
      active: true,
      setParent: true,
    });
  });

  while (!(!navigator.onLine || stop || isApikeyEmpty)) {
    await sleep(cfg.get("loop_run_interval"));

    if (cfg.get("checkbox_auto_open") && isWidget()) {
      const isSolved =
        document.querySelector("div.check")?.style.display === "block";
      if (isSolved) {
        log("found solved");
        break;
      }
      await sleep(cfg.get("delay_before_checkbox_open"));
      document.querySelector("#checkbox")?.click();
    } else if (
      cfg.get("auto_solve") &&
      document.querySelector("h2.prompt-text") !== null
    ) {
      if (cfg.get("debug_logs") === true) log("opening box");
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

  function Toaster(status, text, response) {
    Toast.fire({
      target: "body",
      icon: status,
      title: text + "\n" + response,
      timer: 10000,
      width: "90%",
      timerProgressBar: true,
      color: "#222",
      grow: "row",
      background: "#fff",
      padding: "4em",
      showCloseButton: true,
    });
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

  async function solve() {
    const { target, cells, images } = await onTaskReady();

    if (!cfg.get("auto_solve")) {
      return;
    }
    startTime = new Date();

    const searchParams = new URLSearchParams(location.hash);

    try {
      let response = await fetch(getApi("solve"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          images,
          target,
          method: "hcaptcha_base64",
          sitekey: searchParams.get("sitekey"),
          site: searchParams.get("host"),
          ln: document.documentElement.lang || navigator.language,
          softid: "UserScript" + v,
        }),
      });

      response = await response.json();
      if (cfg.get("debug_logs") === true) log("sent for solving");
      log("🕘 waiting for response");

      if (response.status === "new") {
        if (cfg.get("debug_logs") === true) console.table(response);
        log("waiting 2s");
        await sleep(2000);
        const status = await (await fetch(response.url)).json();
        for (const index of status.solution) {
          cells[index].click();
        }
      } else if (response.status === "solved") {
        if (cfg.get("debug_logs") === true) console.table(response);
        if (cfg.get("debug_logs") === true)
          console.log(
            "noCaptchaAi.com ~ ☑️ server procssed in",
            response.processing_time
          );

        log("🖱️ -> 🖼️");
        const randmin = parseInt(cfg.get("image_click_RandMin"));
        const randmax = parseInt(cfg.get("image_click_RandMax"));
        for (const index of response.solution) {
          cells[index].click();
          await sleep(randTimer(randmin, randmax));
        }
      } else if (response.status === "Unauthorized") {
        isApikeyEmpty = true;
        Toaster(
          "error",
          "noCaptchaAi.com Apikey not valid. \n Popup window will open, if blocked enable and refresh",
          response.status
        );
        await sleep(2000);
        cfg.open("window");
        return log(response.status, response.message);
      } else if (response.error.match("restricted")) {
        Toaster(
          "error",
          "<h3>Account flagged</h3> <h4>a) Buy Plan</h4> <h4>b) Ping on Discord/Telegram for activation</h4> ",
          response.error
        );
        stop = true;
        await sleep(3000);
        window.open("https://dash.nocaptchaai.com");
      } else if (response.error === "Invalid apikey.") {
        Toaster("error", "Please check your apikey details.", response.error);
        console.log(response.error);
        await sleep(4000);
        cfg.open("window");
        stop = true;
      } else if (response.error) {
        Toaster("error", "please verify Apikey and api url", response.error);
        console.log(response.error);
        await sleep(4000);
        cfg.open("window");
        stop = true;
        // return log(response.status);
      }

      let randmin = parseInt(cfg.get("solve_puzzle_within_RandMin"));
      let randmax = parseInt(cfg.get("solve_puzzle_within_RandMax"));

      const elapsedTime = new Date() - startTime;

      const remainingTime = randTimer(randmin, randmax) - elapsedTime;
      // console.log("remaining", remainingTime);
      await sleep(remainingTime);
      if (cfg.get("debug_logs") === true) log("waiting random time");
      // await sleep(cfg.get("delay_before_submit"));
      log("☑️ sent!");
      document.querySelector(".button-submit").click();
      startTime = 0;
    } catch (error) {
      console.error(error);
    }
  }
  function getApi(v) {
    return "https://" + cfg.get("PLAN") + ".nocaptchaai.com/" + v;
  }

  function onSave({ APIKEY }) {
    try {
      if (headers.apikey === APIKEY || APIKEY === "")
        throw new Error("empty or eq");
      GM_xmlhttpRequest({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: APIKEY,
        },
        responseType: "json",
        url: "https://manage.nocaptchaai.com/api/user/get_endpoint",
        onload: function ({ response }) {
          if (response.error) {
            cfg.set("APIKEY", "");
            return alert("wrong apikey");
          }
          cfg.set("PLAN", response.plan === "prepaid" ? "pro" : "free");
        },
      });
    } catch (error) {
      log(error);
    } finally {
      log("reload");
      const iframes = [...document.querySelectorAll("[src*=newassets]")];
      for (const iframe of iframes) {
        const url = iframe.src;
        iframe.src = "about:blank";
        setTimeout(function () {
          iframe.src = url;
        }, 10);
      }
    }
  }

  function onTaskReady(i = 500) {
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
          const url = img.style.background.match(/url\("(.*)"/)?.at(1) || null;
          if (!url || url === "") return;
          images[i] = await getBase64FromUrl(url);
        }

        clearInterval(check_interval);
        return resolve({
          target,
          cells,
          images,
        });
      }, i);
    });
  }
})();
