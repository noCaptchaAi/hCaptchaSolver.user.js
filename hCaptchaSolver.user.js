// ==UserScript==
// @name         hCaptcha Captcha Solver by noCaptchaAi - old
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.5.2
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
  let startTime;
  let stop;
  const v = "3.5.0";

  const freeApi = "https://free.nocaptchaai.com/api/";
  const freeBalApi = freeApi + "user/free_balance";
  const freeSolveApi = freeApi + "solve";

  const proSolveApi = "https://pro.nocaptchaai.com/api/solve";
  const proStatusApi = "https://manage.nocaptchaai.com/api/status";
  const proBalApi = "https://manage.nocaptchaai.com/api/user/get_balance";

  const detectapi = "https://manage.nocaptchaai.com/api/user/get_endpoint";

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
    mode: "iframe",
    params: {
      APIKEY: {
        type: "text",
        default: "",
      },
      Api_Endpoint: {
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
        default: 200,
      },
      image_click_RandMin: {
        type: "number",
        default: 150,
      },
      image_click_RandMax: {
        type: "number",
        default: 250,
      },
      solve_puzzle_within_RandMin: {
        type: "number",
        default: 2000,
      },
      solve_puzzle_within_RandMax: {
        type: "number",
        default: 3000,
      },
      loop_run_interval: {
        type: "number",
        default: 1000,
      },
      debug_logs: {
        type: "checkbox",
        default: true,
      },
    },
  });

  // let isApikeyEmpty = !new Boolean(cfg.get("APIKEY"));
  let isApikeyEmpty = cfg.get("APIKEY").length === 0;
  let isApiEndEmpty = cfg.get("Api_Endpoint").length === 0;
  if (isApikeyEmpty || isApiEndEmpty) {
    Toaster(
      "error",
      "Please setup ApiKey or Api Endpoint Url from https://dash.nocaptchaai.com"
    );
    await sleep(4000);
    cfg.open("iframe");

    stop;
  }
  const headers = {
    "Content-Type": "application/json",
    apikey: cfg.get("APIKEY"),
  };
  console.log(cfg.get("APIKEY").length === 0);
  log(
    "auto open= " +
      cfg.get("checkbox_auto_open") +
      " | " +
      "auto solve= " +
      cfg.get("auto_solve") +
      " | " +
      "loop running in bg"
  );
  // if (cfg.get("APIKEY").length !== 0 && !GM_getValue("initdone")) {
  //   GM_xmlhttpRequest({
  //     method: "GET",
  //     headers,
  //     responseType: "json",
  //     url: detectapi,
  //     onload: function (xhr) {
  //       log(xhr.responseText);
  //       log(xhr.status === 200);
  //       if (xhr) {
  //         let json = JSON.parse(xhr.responseText);
  //         console.log("api2", json.endpoint);
  //         console.log("api2", json.error);
  //         GM_setValue("api_endpoint", json.endpoint);
  //         if (json.error) {
  //           GM_setValue("initdone", "no");
  //         } else {
  //           GM_setValue("initdone", "yes");
  //         }

  //         Toaster(
  //           "success",
  //           "<b>noCaptchaAi.com ~</b><i>Allowed endpoint for Apikey</i>",
  //           json.endpoint
  //         );
  //       }
  //     },
  //   });
  // }

  if (!isApikeyEmpty && !isApiEndEmpty) {
    GM_registerMenuCommand("💲 Check Balance fetch", async function () {
      let response = await fetch(
        cfg.get("Api_Endpoint") === "https://free.nocaptchaai.com/api/solve"
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
  } else if (document.querySelector("#warning")) {
    const div = document.createElement("div");
    div.onclick = function (e) {
      e.preventDefault();
      cfg.open("window", {
        windowFeatures: {
          width: 500,
        },
      });
    };
    div.style =
      "color: rgb(235, 87, 87); font-size: 10px; bottom: 5px; left: 5px; width: 75%; position: absolute;";
    div.innerHTML = "<code>apikey</code> not set. Click here to set up";
    document.querySelector("#warning").insertAdjacentElement("afterEnd", div);
  }
  if (!isApikeyEmpty && !isApiEndEmpty) {
    GM_registerMenuCommand("💲 Check Balance xmlHttp ", function () {
      GM_xmlhttpRequest({
        method: "GET",
        headers,
        url:
          cfg.get("Api_Endpoint") === "https://free.nocaptchaai.com/api/solve"
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
    "📈 Dashboard/ 💰 Buy Plan / 👛 Balance info",
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

  log("Run done");

  while (true) {
    if (!navigator.onLine || isApikeyEmpty) break;
    if (stop) break;

    await sleep(cfg.get("loop_run_interval"));

    if (cfg.get("checkbox_auto_open") && isWidget()) {
      const isSolved =
        document.querySelector("div.check")?.style.display === "block";
      if (isSolved && cfg.get("debug_logs")) log("found solved");
      if (isSolved) break;
      await sleep(cfg.get("delay_before_checkbox_open"));
      document.querySelector("#checkbox")?.click();
    } else if (
      cfg.get("auto_solve") &&
      document.querySelector("h2.prompt-text") !== null
    ) {
      await solve();
      if (cfg.get("debug_logs") === true) log("opening box");
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
    const { target, cells, images } = await on_task_ready();

    if (!cfg.get("auto_solve")) {
      return;
    }
    startTime = new Date();

    const searchParams = new URLSearchParams(location.hash);

    try {
      let response = await fetch(cfg.get("Api_Endpoint"), {
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
      // console.log(randTimer(randmin, randmax));
      // console.log("rand", typeof randmax, randmax, randmin);

      const elapsedTime = new Date() - startTime;
      // console.log("elapsed", elapsedTime);
      // TODO
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
