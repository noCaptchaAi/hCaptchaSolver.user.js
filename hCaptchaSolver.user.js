// ==UserScript==
// @name         hCaptcha Captcha Solver by noCaptchaAi
// @name:ar      noCaptchaAI hCaptcha Solver حلال
// @name:ru      noCaptchaAI Решатель капчи hCaptcha
// @name:sh-CN   noCaptchaAI 验证码求解器
// @namespace    https://nocaptchaai.com
// @version      3.0.0
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
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_getResourceURL
// @grant        GM_notification
// @grant        GM_log
// @grant        GM_addElement
// @license      MIT
// ==/UserScript==

let unauth;
let count = 1;

const base = "https://free.nocaptchaai.com/api/";
const balUrl = base + "account/balance";
const baseUrl = base + "solve";
const demoimg = "https://i.imgur.com/VvLYXIL.png";
const logo = "https://docs.nocaptchaai.com/img/nocaptchaai.com.png";

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

//

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
      default: false,
    },
    delay_before_checkbox_open: {
      type: "number",
      default: "1000",
    },
    delay_between_image_clicking_min: {
      type: "number",
      default: "250",
    },
    delay_between_image_clicking_max: {
      type: "number",
      default: "450",
    },
    delay_before_submit: {
      type: "number",
      default: "2000",
    },
    loop_run_interval: {
      type: "number",
      default: "1000",
    },
    // show_balance_every: {
    //   type: "select",
    //   choices: ["5", "10", "20"],
    //   default: "5",
    // },
    // show_balance_notification: {
    //   type: "checkbox",
    //   default: false,
    // },
    // show_balance_log: {
    //   type: "checkbox",
    //   default: false,
    // },
    Disable_showing_this_popup_on_all_sites: {
      type: "checkbox",
      default: false,
    },
  },
});
// const cfg2 = new MonkeyConfig({
//   title: "⚙️Api Only Settings",
//   menuCommand: true,
//   displayed: true,
//   overlay: true,
//   openLayer: true,
//   params: {
//     UID: {
//       type: "text",
//       default: cfg.get("UID"),
//     },
//     APIKEY: {
//       type: "text",
//       default: cfg.get("APIKEY"),
//     },
//   },
// });

// show balance
GM_registerMenuCommand("👛 Check Balance", async function showBalMenu() {
  log(cfg.get("UID") + cfg.get("APIKEY"));
  let response = await fetch(balUrl, {
    method: "get",
    // referrer: "none",
    // cache: "no-cache",
    // mode: "no-cors",
    headers: {
      "Content-Type": "application/json",
      uid: cfg.get("UID"),
      apikey: cfg.get("APIKEY"),
    },
  })
    .then((response) => response.json())
    .catch((error) => console.log(error));
  baljson = response;
  response = JSON.stringify(await response, null, "\t");

  if (baljson.status === "Unauthorized") {
    Toast.fire({
      icon: "error",
      title:
        "<b>noCaptchaAi.com ~</b><i> Balance:-</i>" +
        "\n \n" +
        (await response),
      timer: 10000,
      width: "28em",
      timerProgressBar: true,
      allowOutsideClick: "true",
      color: "#222",
      grow: "row",
      background: "#fff",
      padding: "2em",
      backdrop: true,
      showCloseButton: true,
    });

    await sleep(2000);
    cfg.open();
  } else {
    Toast.fire({
      icon: "success",
      title:
        "<b>noCaptchaAi.com ~</b><i> Balance:-</i>" +
        "\n \n" +
        (await response),
      timer: 10000,
      width: "28em",
      timerProgressBar: true,
      allowOutsideClick: "true",
      color: "#222",
      grow: "row",
      background: "#fff",
      padding: "2em",
      backdrop: true,
      showCloseButton: true,
    });
  }
});
GM_registerMenuCommand("💸 Buy Quota Balance", () => {
  window.open("https://nocaptchaai.com/buy.html");
});
GM_registerMenuCommand("📄 Api Docs", () => {
  window.open("https://docs.nocaptchaai.com/category/api-methods");
});
GM_registerMenuCommand("📈 Dashboard", () => {
  window.open("https://dash.nocaptchaai.com");
});
// const apipop = GM_registerMenuCommand("Api setup", async () => {
//   const { value: formValues } = await Swal.fire({
//     title: "Setup noCaptchaAi.com Api",
//     html: `<input id="swal-uid" class="swal2-input" placeholder="UID">
//       <input id="swal-apikey" class="swal2-input" placeholder="APIKEY">`,
//     focusConfirm: true,
//     confirmButtonText: "Save",
//     preConfirm: () => {
//       return [
//         document.getElementById("swal-uid").value,
//         document.getElementById("swal-apikey").value,
//       ];
//     },
//   });

//   if (formValues) {
//     // set("UID", document.getElementById("swal-uid").value);
//     // set("APIKEY", document.getElementById("swal-apikey").value);
//     cfg.set = function () {
//       set("UID", "uid232");
//       set("APIKEY", "paik3434");
//       update();
//       console.log(update());
//     };
//   }
// });

// async function showBal() {
//   console.log("check balance ran");
//   let response = await fetch(balUrl, {
//     method: "get",
//     // cache: "no-cache",
//     // mode: "no-cors",
//     headers: {
//       "Content-Type": "application/json",
//       uid: cfg.get("UID"),
//       apikey: cfg.get("APIKEY"),
//     },
//   })
//     .then((response) => response.json())
//     .catch((error) => console.log(error));

//   response = JSON.stringify(await response, null, "\t");

//   if (cfg.get("show_balance_notification")) {
//     Toast.fire({
//       icon: "success",
//       title:
//         "<b>noCaptchaAi.com ~</b><i> Balance:-</i>" +
//         "\n \n" +
//         (await response),
//       timer: 10000,
//       width: "28em",
//       timerProgressBar: true,
//       allowOutsideClick: "true",
//       color: "#222",
//       grow: "row",
//       background: "#fff !important",
//       padding: "2em",
//       backdrop: true,
//       showCloseButton: true,
//     });
//   }
//   if (cfg.get("show_balance_log")) {
//     console.log("balance info" + response);
//   }
// }

//
// function callEveryTen() {
//   setInterval(showBal, 1000 * cfg.get("show_balance_every") * 60);
// }

//

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
        await sleep(random(cfg.get("delay_between_image_clicking_max")));
      }
    } else if (response.status === "Unauthorized") {
      unauth = true;

      Toast.fire({
        icon: "error",
        title: "Apikey or uid not valid,",
        text: "please check details again on script menu.",
        timer: 10000,
        width: "58em",
        timerProgressBar: true,
        allowOutsideClick: "true",
        color: "#000",
        grow: "row",
        background: "#b04040",
        background: "#b04040 !important",
        padding: "1em",
        backdrop: true,
        showCloseButton: true,
      });

      await sleep(3000);

      // cfg.open("layer");

      return log(response.status, response.message);
    } else {
      return log(response.status);
    }

    await sleep(cfg.get("delay_before_submit"));
    log("☑️ sent!");
    document.querySelector(".button-submit").click();
  } catch (error) {
    console.error(error);
  }
}

// looper

(async () => {
  // await sleep(1000);
  // callEveryTen();

  log("Auto 🖱️ is " + cfg.get("checkbox_auto_open"));
  log("Auto ☑️ is " + cfg.get("auto_solve"));
  log("Running in 🌅 background");

  while (true) {
    //
    log("🕒 session duration:- " + count++ + "s");
    if (!navigator.onLine) break;
    if (unauth) break;

    if (cfg.get("APIKEY").length === 0 || cfg.get("UID").length === 0) {
      log("APIKEY or UID not set, fill on popup and save");

      if (cfg.get("Disable_showing_this_popup_on_all_sites") === false) {
        cfg.open();
      }

      break;
    }

    await sleep(cfg.get("loop_run_interval"));

    if (cfg.get("checkbox_auto_open") && isWidget()) {
      const isSolved =
        document.querySelector("div.check")?.style.display === "block";
      if (isSolved) {
        ("new ones not found, loop stopped");
      }
      // if (isSolved) break;
      await sleep(cfg.get("delay_before_checkbox_open"));
      // log(
      //   "loop interval " +
      //     " " +
      //     cfg.get("delay_before_checkbox_open") / 1000 +
      //     "s"
      // );
      document.querySelector("#checkbox")?.click();
    } else if (cfg.get("checkbox_auto_open")) {
      const isSolved =
        document.querySelector("div.check")?.style.display === "block";
      // if (isSolved) break;
      await sleep(cfg.get("delay_before_checkbox_open"));
      document.querySelector("#checkbox")?.click();
      await solve();
    } else if (
      cfg.get("auto_solve") &&
      document.querySelector("h2.prompt-text") !== null
    ) {
      await solve();
    }
  }
  
  console.log("Run done")
})();
