// ==UserScript==
// @name         hCaptcha Solver by noCaptchaAi
// @namespace    https://nocaptchaai.com
// @version      4.1.0
// @description  hCaptcha Solver automated Captcha Solver bypass Ai service. Free 6000 🔥solves/month! 50x⚡ faster than 2Captcha & others
// @author       noCaptcha AI and Diego
// @match        *://*/*
// @match        https://config.nocaptchaai.com/?apikey=*
// @icon         https://avatars.githubusercontent.com/u/110127579
// @require      https://greasyfork.org/scripts/395037-monkeyconfig-modern/code/MonkeyConfig%20Modern.js
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
      AUTO_SOLVE: {
        label: "Auto Solve",
        type: "checkbox",
        default: true,
      },
      CHECKBOX_AUTO_OPEN: {
        label: "Auto Open",
        type: "checkbox",
        default: true,
      },
      ALWAYS_SOLVING: {
        label: "Always Solving",
        type: "checkbox",
        default: true,
      },
      DEBUG_LOGS: {
        type: "checkbox",
        label: "Console logs",
        default: false,
      },
      APIKEY: {
        label: "APIKEY",
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
        label: "Custom API",
        default: "",
      },
      DELAY_OPEN: {
        type: "number",
        label: "Delay Open",
        default: 1,
      },
      SOLVE_IN_SEC_GRID: {
        type: "number",
        label: "Solve In Seconds",
        default: 3,
      },
      SOLVE_IN_SEC_MULTI_and_BBOX: {
        type: "number",
        label: "Solve In Seconds for Multiple Choice",
        default: 1,
      },
      LOOP: {
        type: "number",
        label: "Loop Interval In Sec",
        default: 1,
      },
    },
    onSave,
    menuCommand: true,
  });

  const searchParams = new URLSearchParams(location.hash);
  const logs = cfg.get("DEBUG_LOGS");
  let target_xhr = "";
  let lang_xhr = "";
  let req_q = {};
  let captype = "";
  let choices = [];
  const requestTypeToCaptype = {
    image_label_multiple_choice: "multi",
    image_label_binary: "grid",
    image_label_area_select: "bbox",
  };

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function () {
    this.addEventListener("readystatechange", onXHReady);
    open.apply(this, arguments);
  };

  let startTime;
  let stop = false;
  const v = GM_info.script.version;

  const freeApi = "https://free.nocaptchaai.com/api/";
  const freeBalApi = freeApi + "user/free_balance";
  const proBalApi = "https://manage.nocaptchaai.com/api/user/get_balance";
  let apikey = cfg.get("APIKEY");

  function log(msg) {
    if (logs) {
      console.log(
        `%cnoCaptchaAi.com ~ %c${msg}`,
        "background: #222; color: #bada55",
        ""
      );
    }
  }

  (() => {
    GM_addStyle(`
      .swal2-container {
        z-index: 9990;
      }
    `);
  })();

  // if (location.search.startsWith("?apikey=")) {
  if (location.hostname === "config.nocaptchaai.com") {
    const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });

    if (
      params.apikey &&
      params.plan &&
      (document.location.host === "config.nocaptchaai.com" ||
        document.referrer === "https://dash.nocaptchaai.com/")
    ) {
      cfg.set("APIKEY", params.apikey);
      cfg.set("PLAN", params.plan);
      cfg.set("Custom_Endpoint", params.custom_api || "");

      cfg.open();
      if (document.getElementById("__MonkeyConfig_frame")) {
        let iframe = document.getElementById("__MonkeyConfig_frame");
        let innerDoc = iframe.contentDocument || iframe.contentWindow.document;
        innerDoc.getElementById("__MonkeyConfig_button_save")?.click();
        // if (logs) console.log(iframe);
        // if (logs) console.log(innerDoc);
      }

      // console.log(cfg.get("APIKEY"), cfg.get("PLAN"));
    }

    const get_endpoint = "https://manage.nocaptchaai.com/api/user/get_endpoint";

    const apikey = cfg.get("APIKEY");
    // console.log(apikey, cfg.get("APIKEY"));

    if (apikey.length < 0) {
      throw new Error("empty apikey");
    } else {
      (async () => {
        let res = await fetch(get_endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            apikey: apikey,
          },
        });
        res = await res.json();
        // console.log(res);
        if (res.error) {
          jsNotif(res.error + "\n noCaptchaAi Extension Config failed ✘");
          cfg.set("APIKEY", "");
        } else if (res.plan === "free") {
          jsNotif("noCaptchaAi Extension \n Config Successful ✔️");

          const iframes = [...document.querySelectorAll("[src*=newassets]")];
          for (const iframe of iframes) {
            const url = iframe.src;
            iframe.src = "about:blank";
            setTimeout(function () {
              iframe.src = url;
            }, 10);
          }
        } else if (res.plan !== null || "free") {
          jsNotif(
            `noCaptchaAi Extension ${res.plan} plan \n Config Successful ✔️`
          );
        }
      })();
    }
  }

  if (window.top === window) {
    if (logs) {
      const autoOpen = cfg.get("CHECKBOX_AUTO_OPEN");
      const autoSolve = cfg.get("AUTO_SOLVE");
      log(`auto open: ${autoOpen} | auto solve: ${autoSolve}`);
    }
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: apikey,
  };

  const autoOpen = cfg.get("CHECKBOX_AUTO_OPEN");
  const autoSolve = cfg.get("AUTO_SOLVE");
  log(`auto open: ${autoOpen} | auto solve: ${autoSolve}`);

  // Define an array of menu commands with labels and URLs
  const menuCommands = [
    { label: "🏠 HomePage", url: "https://nocaptchaai.com" },
    {
      label: "📈 Dashboard /💰 Buy Solves /💲 Balance",
      url: "https://dash.nocaptchaai.com",
    },
    {
      label: "📄 Api Docs",
      url: "https://docs.nocaptchaai.com",
    },
    { label: "❓ Discord", url: "https://discord.gg/E7FfzhZqzA" },
    { label: "❓ Telegram", url: "https://t.me/noCaptchaAi" },
  ];

  // Register each menu command with GM_registerMenuCommand
  menuCommands.forEach(({ label, url }) => {
    GM_registerMenuCommand(label, () => {
      if (window.top === window) {
        GM_openInTab(url, {
          active: true,
          setParent: true,
        });
      }
    });
  });

  function jsNotif(message, duration) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      top: 10%;
      left: 0;
      background-color: rgba(0, 0, 0, 0.8);
      border-radius: 4px;
      padding: 16px;
      color: #fff;
      font-size: calc(14px + 0.5vw);
      font-family: 'Arial', sans-serif;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      z-index: 9999;
      transition: all 1s ease-in-out;
    `;
    toast.innerHTML = `${message}`;
    document.body.appendChild(toast);

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes slideIn {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(0); }
      }
  
      @keyframes slideOut {
        0% { transform: translateX(0); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);

    // Slide in animation
    toast.style.animation = "slideIn 1s forwards";
    toast.style.animationFillMode = "forwards";

    setTimeout(() => {
      // Slide out animation
      toast.style.animation = "slideOut 1s forwards";

      setTimeout(() => {
        document.body.removeChild(toast);
      }, 1000);
    }, duration || 3000);
  }
  // async function jsNotif(textContent) {
  //   const container = document.createElement("div");
  //   container.id = "jsNotif";
  //   container.style.position = "fixed";
  //   container.style.top = "50%";
  //   container.style.left = "50%";
  //   container.style.transform = "translate(-50%, -50%)";
  //   container.style.background = "linear-gradient(to right, #00b4db, #0083b0)";
  //   container.style.color = "#fff";
  //   container.style.fontSize = "25px";
  //   container.style.padding = "30px";
  //   container.style.borderRadius = "10px";
  //   container.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)";

  //   document.body.appendChild(container);

  //   const delay = 15; // Adjust this to control the typing speed

  //   for (let i = 0; i < textContent.length; i++) {
  //     await sleep(delay); // Pause before adding the next character
  //     container.textContent += textContent[i];
  //   }

  //   const style = document.createElement("style");
  //   style.textContent = `@keyframes fade-in-out {
  //     0% {
  //       opacity: 0;
  //     }
  //     10% {
  //       opacity: 1;
  //     }
  //     90% {
  //       opacity: 1;
  //     }
  //     100% {
  //       opacity: 0;
  //     }
  //   }

  //   #jsNotif {
  //     animation: fade-in-out 3s ease-in-out forwards;
  //   }`;

  //   document.head.appendChild(style);
  // }

  while (!(!navigator.onLine || stop || !apikey)) {
    await sleep(cfg.get("LOOP") * 1000);
    // console.log("looping");

    if (cfg.get("CHECKBOX_AUTO_OPEN") && isWidget()) {
      const isSolved =
        document.querySelector("div.check")?.style.display === "block";
      if (isSolved) {
        log("found solved");
        if (cfg.get("ALWAYS_SOLVING") === false) break;
      }
      await sleep(cfg.get("DELAY_OPEN"));
      document.querySelector("#checkbox")?.click();
    } else if (
      cfg.get("AUTO_SOLVE") &&
      document.querySelector("h2.prompt-text") !== null
    ) {
      if (cfg.get("DEBUG_LOGS") === true) log("opening box");
      addLogo(".interface-challenge", "-1px");
      await sleep(1000); // important don't remove
      await solve();
    }
  }

  function isMulti() {
    return document.querySelector(".task-answers") !== null;
  }
  function isGrid() {
    return document.querySelectorAll(".task-image .image")?.length === 9;
  }
  function isBbox() {
    return document.querySelector(".bounding-box-example") !== null;
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

  // async function getBase64FromUrl(url) {
  //   const blob = await (await fetch(url)).blob();
  //   return new Promise(function (resolve) {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(blob);
  //     reader.addEventListener("loadend", function () {
  //       resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
  //     });
  //     reader.addEventListener("error", function () {
  //       log("❌ Failed to convert url to base64");
  //     });
  //   });
  // }
  async function getBase64FromUrl(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const blob = await response.blob();

      return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.addEventListener("loadend", function () {
          resolve(reader.result.replace(/^data:image\/(png|jpeg);base64,/, ""));
        });
        reader.addEventListener("error", function () {
          console.error("❌ Failed to convert url to base64");
          reject(new Error("Failed to convert url to base64"));
        });
      });
    } catch (error) {
      console.error(
        "❌ Error fetching the image or converting to base64:",
        error
      );
      throw error;
    }
  }

  async function solve() {
    let previousTask = [];

    // if (!isMulti()) {
    //   await sleep(500);
    //   document.querySelector(".button-submit").click();
    //   return;
    // }

    const { target, cells, images, example, choices } = await onTaskReady();

    if (!cfg.get("AUTO_SOLVE")) {
      return;
    }
    startTime = new Date();
    const searchParams = new URLSearchParams(location.hash);
    const type =
      captype === "multi" ? "multi" : captype === "bbox" ? "bbox" : "grid";

    try {
      previousTask = images;
      const ob = { ...req_q };
      const pText = document.querySelector(".prompt-text")?.textContent; // use destructuring to extract the textContent property safely
      ob.frame = pText;
      let response = await fetch(getApi("solve"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          images,
          target,
          altln: ob,
          method: "hcaptcha_base64",
          type,
          choices: captype === "multi" ? choices : [],
          sitekey: searchParams.get("sitekey"),
          site: searchParams.get("host"),
          ln:
            lang_xhr !== ""
              ? "en"
              : document.documentElement.lang || navigator.language,
          softid: "Userscript_v" + v,
        }),
      });

      response = await response.json();

      const newurl = response.url;
      const ans = response.answer; // ans for multi choice
      const msg = response.message;
      const sts = response.status;
      let clicks = 0;
      const clicktime = randTimer(300, 450);

      if (cfg.get("DEBUG_LOGS") === true) console.table(response);

      if (response.error || response.status === "skip") {
        console.log(response.message);
        jsNotif("⚠" + response.message);
      } else if (response.status === "new") {
        if (captype === "multi") {
          const status = await (await fetch(response.url)).json();
          const res = status.answer;
          console.log(res, "res");
          for (const e in res) {
            const ele = [...document.querySelectorAll(".answer-text")].find(
              (element) => res.some((e) => element.outerText === e)
            );
            console.log(ele.children?.outerText);
            fireMouseEvents(ele);
            await sleep(400);
            document.querySelector(".submit-button")?.click();
          }
        } else if (captype === "grid") {
          await sleep(1000);
          const status = await (await fetch(response.url)).json();
          for (const index of shuffle(status.solution)) {
            cells[index].click();
            await sleep(clicktime);
          }
        } else if (captype === "bbox") {
          console.log("captype bbox", captype);
          const res = await (await fetch(newurl)).json();
          const ans = res.answer;
          if (!ans) return;
          if (ans?.length === 2) {
            console.log("bbox", ans);
            area(ans);
            clicks = clicks + 1;
            await sleep(500);
          }
        }
      } else if (response.status === "solved") {
        if (captype === "multi") {
          const res = response.answer;
          console.log(res, "res");
          for (const e in res) {
            const ele = [...document.querySelectorAll(".answer-text")].find(
              (element) => res.some((e) => element.outerText === e)
            );
            console.log(ele);
            fireMouseEvents(ele);
            await sleep(400);
            document.querySelector(".submit-button")?.click();
          }
        } else if (captype === "grid") {
          for (const index of shuffle(response.solution)) {
            cells[index].click();
            await sleep(clicktime);
          }
        } else if (captype === "bbox") {
          if (!ans) return;
          if (ans?.length === 2) {
            area(ans);
            clicks = clicks + 1;
            await sleep(500);
          }
        }
      }

      console.log("multi hcap ~ clicks", clicks);
      const ET = new Date() - startTime;
      const RT =
        (captype === "multi" || "bbox"
          ? cfg.get("SOLVE_IN_SEC_MULTI_and_BBOX") * 1000 - ET
          : cfg.get("SOLVE_IN_SEC_GRID")) *
          1000 -
        ET;
      if (RT < 0) {
        await sleep(500);
      }

      // if (captype === "bbox") {
      //   try {
      //     feedback(
      //       await slice("canvas"),
      //       response.target,
      //       "bbox",
      //       response.id,
      //       response.answer,
      //       apikey
      //     );
      //   } catch (error) {
      //     console.log(error);
      //   }
      // }

      if (logs) log("☑️ sent!");
      document.querySelector(".button-submit").click();
      startTime = 0;
    } catch (error) {
      console.error(error);
    }
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async function feedback(image, target, type, id, answer, apikey) {
    await fetch("https://free.nocaptchaai.com/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apikey,
      },
      body: JSON.stringify({
        image,
        target,
        type,
        answer,
        id,
      }),
    });
  }
  // function fireMouseEvents(element) {
  //   ["mouseover", "mousedown", "mouseup", "click"].forEach((eventName) => {
  //     if (element.fireEvent) {
  //       element.fireEvent("on" + eventName);
  //     } else {
  //       const eventObject = document.createEvent("MouseEvents");
  //       eventObject.initEvent(eventName, true, false);
  //       element.dispatchEvent(eventObject);
  //     }
  //   });
  // }
  function fireMouseEvents(element) {
    if (!document.contains(element)) return;
    ["mouseover", "mousedown", "mouseup", "click"].forEach((eventName) => {
      const eventObject = new MouseEvent(eventName, { bubbles: true });
      element.dispatchEvent(eventObject);
    });
  }

  function getApi(v) {
    if (cfg.get("Custom_Endpoint")) {
      if (logs) console.log("custom", cfg.get("Custom_Endpoint"));
      return cfg.get("Custom_Endpoint") + v;
    } else {
      return "https://" + cfg.get("PLAN") + ".nocaptchaai.com/" + v;
    }
  }

  function onSave({ APIKEY }) {
    try {
      if (headers.apikey === apikey || apikey === "")
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
            return jsNotif(response.error);
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

  // function clickOnCanvas(canvas, x, y) {
  //   const rect = canvas.getBoundingClientRect();
  //   const events = ["mouseover", "mousedown", "mouseup", "click"];
  //   const options = {
  //     // clientX: x + 83,
  //     clientX: x + rect.left,
  //     // clientY: y + 63,
  //     clientY: y + rect.top,
  //     bubbles: true,
  //   };

  //   for (let i = 0; i < events.length; i++) {
  //     const event = new MouseEvent(events[i], options);
  //     canvas.dispatchEvent(event);
  //   }
  // }

  async function area(data) {
    function clickOnCanvas(canvas, x, y) {
      const rect = canvas.getBoundingClientRect();
      const events = ["mouseover", "mousedown", "mouseup", "click"];
      const options = {
        // clientX: x + 83, //rect.left
        clientX: x + rect.left,
        // clientY: y + 63, // rect.top
        clientY: y + rect.top,
        bubbles: true,
      };

      for (let i = 0; i < events.length; i++) {
        const event = new MouseEvent(events[i], options);
        canvas.dispatchEvent(event);
      }
    }
    const canvas = document.querySelector("canvas");
    canvas.addEventListener("mousedown", function (e) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (logs) console.log("x: " + x + " y: " + y, data);
    });
    const [x, y] = data;
    clickOnCanvas(canvas, x, y);
  }

  // function clickOnCanvas(canvas, x, y) {
  //   const rect = canvas.getBoundingClientRect();
  //   const originalImageWidth = 662;
  //   const originalImageHeight = 662;
  //   const canvasWidth = 1000;
  //   const canvasHeight = 1072;

  //   // Calculate relative coordinates
  //   const relativeX = (x * canvasWidth) / originalImageWidth;
  //   const relativeY = (y * canvasHeight) / originalImageHeight;

  //   const events = ["mouseover", "mousedown", "mouseup", "click"];
  //   const options = {
  //     clientX: relativeX + rect.left,
  //     clientY: relativeY + rect.top,
  //     bubbles: true,
  //   };

  //   for (let i = 0; i < events.length; i++) {
  //     const event = new MouseEvent(events[i], options);
  //     canvas.dispatchEvent(event);
  //   }
  // }

  async function clickMatchingElement(res) {
    for (const e of res) {
      const ele = [...document.querySelectorAll(".answer-text")].find(
        (el) => el.outerText === e
      );
      // if(logs) console.log(ele?.children?.children?.outerText);
      fireMouseEvents(ele);
      // await sleep(500);
      if (
        ![...document.querySelectorAll(".answer-example")].some(
          (el) => el.style.backgroundColor === "rgb(116, 116, 116)"
        )
      ) {
        fireMouseEvents(ele);
      }
      // await sleep(500);
    }
  }

  async function sliceOG() {
    const originalCanvas = document.querySelector("canvas");
    if (!originalCanvas) return null;

    const [originalWidth, originalHeight] = [
      originalCanvas.width,
      originalCanvas.height,
    ];

    // Check if the original canvas has content
    const originalCtx = originalCanvas.getContext("2d");
    const originalImageData = originalCtx.getImageData(
      0,
      0,
      originalWidth,
      originalHeight
    );
    const allPixelsTransparentOrBlack = Array.from(
      originalImageData.data
    ).every((value, index) => index % 4 === 3 || value === 0);

    if (allPixelsTransparentOrBlack) {
      console.error("The original canvas has no valid content");
      return null;
    }

    const desiredWidth = parseInt(originalCanvas.style.width, 10);
    const desiredHeight = parseInt(originalCanvas.style.height, 10);

    // Check if the desired width and height are valid positive numbers
    if (desiredWidth <= 0 || desiredHeight <= 0) {
      console.error("Desired width and height should be positive numbers");
      return null;
    }

    const scaleFactor = Math.min(
      desiredWidth / originalWidth,
      desiredHeight / originalHeight
    );
    const [outputWidth, outputHeight] = [
      originalWidth * scaleFactor,
      originalHeight * scaleFactor,
    ];

    const outputCanvas = document.createElement("canvas");
    Object.assign(outputCanvas, { width: outputWidth, height: outputHeight });

    const ctx = outputCanvas.getContext("2d");
    ctx.drawImage(
      originalCanvas,
      0,
      0,
      originalWidth,
      originalHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return outputCanvas
      .toDataURL("image/jpeg", 0.4)
      .replace(/^data:image\/(png|jpeg);base64,/, "");
  }

  // async function sliceOG() {
  //   const originalCanvas = document.querySelector("canvas");
  //   if (!originalCanvas) return null;

  //   const [originalWidth, originalHeight] = [
  //     originalCanvas.width,
  //     originalCanvas.height,
  //   ];
  //   const scaleFactor = Math.min(500 / originalWidth, 536 / originalHeight);
  //   const [outputWidth, outputHeight] = [
  //     originalWidth * scaleFactor,
  //     originalHeight * scaleFactor,
  //   ];

  //   const outputCanvas = document.createElement("canvas");
  //   Object.assign(outputCanvas, { width: outputWidth, height: outputHeight });

  //   const ctx = outputCanvas.getContext("2d");
  //   ctx.drawImage(
  //     originalCanvas,
  //     0,
  //     0,
  //     originalWidth,
  //     originalHeight,
  //     0,
  //     0,
  //     outputWidth,
  //     outputHeight
  //   );

  //   return outputCanvas
  //     .toDataURL("image/jpeg", 0.4)
  //     .replace(/^data:image\/(png|jpeg);base64,/, "");
  // }
  async function slice(element) {
    const canvas = document.querySelector(element);
    if (!canvas) return;

    const [width, height] = [662, 662];
    const [sourceX, sourceY] = [169, canvas.height - 500 - 181];

    const slicedCanvas = document.createElement("canvas");
    const ctx = slicedCanvas.getContext("2d");
    slicedCanvas.width = width;
    slicedCanvas.height = height;

    ctx.drawImage(canvas, sourceX, sourceY, width, height, 0, 0, width, height);

    const dataUrl = slicedCanvas.toDataURL("image/jpeg", 0.5);
    let data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");

    return data;
  }

  // async function onXHReady() {
  //   if (this.responseType === "" && this.responseText) {
  //     const resurl = this.responseURL;
  //     let pRes = {};
  //     try {
  //       pRes = JSON.parse(this.responseText);
  //     } catch (error) {
  //       console.warn(error);
  //     }
  //     const rq = pRes?.requester_question;
  //     if (resurl.startsWith("https://hcaptcha.com/getcaptcha")) {
  //       target_xhr = rq?.en;
  //       lang_xhr = "en";
  //       captype = requestTypeToCaptype[pRes?.request_type] || "";

  //       choices = pRes?.requester_restricted_answer_set
  //         ? Object.values(pRes.requester_restricted_answer_set).map(
  //             (obj) => obj.en
  //           )
  //         : null;
  //     } else {
  //       const searchParams = new URL(resurl).searchParams;
  //       const sitekey = searchParams?.get("sitekey");

  //       if (resurl.endsWith(`getcaptcha/${sitekey}`)) {
  //         target_xhr = requesterQuestion?.en;
  //         lang_xhr = "en";
  //         if (logs) console.log("target_xhrSitekey", target_xhr);
  //       }
  //     }
  //   }
  // }

  async function onXHReady() {
    if (this.responseType === "" && this.responseText) {
      const resurl = this.responseURL;
      let pRes = {};
      try {
        pRes = JSON.parse(this.responseText);
        // console.log("pRes", pRes);
      } catch (error) {}
      const rq = pRes?.requester_question;
      if (resurl.startsWith("https://hcaptcha.com/getcaptcha")) {
        target_xhr = rq?.en;
        lang_xhr = "en";
        captype = requestTypeToCaptype[pRes?.request_type] || "";

        choices = pRes?.requester_restricted_answer_set
          ? Object.values(pRes.requester_restricted_answer_set).map(
              (obj) => obj.en
            )
          : null;
      } else {
        const searchParams = new URL(resurl).searchParams;
        const sitekey = searchParams?.get("sitekey");

        if (resurl.endsWith(`getcaptcha/${sitekey}`)) {
          target_xhr = requesterQuestion?.en;
          lang_xhr = "en";
          if (logs) console.log("target_xhrSitekey", target_xhr);
        }
      }
    }
  }

  async function onTaskReady(interval = 500) {
    return new Promise(async (resolve) => {
      const checkInterval = setInterval(async () => {
        const targetText =
          target_xhr ?? document.querySelector(".prompt-text")?.textContent;
        if (!targetText) return;

        let cells = null;
        const images = {};
        let example = {};
        let choices = [];

        if (captype === "grid") {
          cells = document.querySelectorAll(".task-image .image");
          if (cells.length !== 9) return;

          await Promise.all(
            Array.from(cells).map(async (img, i) => {
              const url =
                img.style.background?.match(/url\("(.*)"/)?.[1] ?? null;
              if (!url || url === "") return;
              images[i] = await getBase64FromUrl(url);
            })
          );
        } else if (captype === "multi") {
          const bg = document.querySelector(".task-image .image-wrapper .image")
            ?.style.background;
          const singleImgUrl = bg?.match(/url\("(.*)"/)?.[1] ?? null;
          if (!singleImgUrl) return;
          const singleImg = await getBase64FromUrl(singleImgUrl);

          Object.assign(images, { [Object.keys(images).length]: singleImg });

          choices = Array.from(document.querySelectorAll(".answer-text")).map(
            (el) => el.outerText
          );
        } else if (captype === "bbox") {
          const canvasImg = await sliceOG("canvas").catch((error) => {
            if (logs) console.log(error);
          });
          // const canvasImg = await sliceOG("canvas").catch((error) => {
          //   if (logs) console.log(error);
          // });
          if (!canvasImg) return;

          Object.assign(images, { [Object.keys(images).length]: canvasImg });
        }

        clearInterval(checkInterval);
        resolve({ target: targetText, cells, images, example, choices });
      }, interval);
    });
  }

  function addLogo(className, bottom) {
    const elements = document.querySelectorAll(className);
    elements.forEach((element) => {
      const img = document.createElement("img");
      const p = document.createElement("p");
      const style = document.createElement("style");

      p.textContent = "v" + v;
      p.style.cssText = `
      display: inline-block;
      width: 10px;
      height: 10px;
      z-index: 99999;
      left: 64%;
      margin-left: -28px;
      cursor: pointer;
      filter: drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.5));
      position: absolute;
      bottom: ${bottom};
      `;

      img.src =
        "data:image/webp;base64,UklGRn4DAABXRUJQVlA4WAoAAAAwAAAALwAALwAAQUxQSIUBAAANkKPtv2k733+tfW5s2+WtThlbA7DtdDY6jMBOWjsTUGXbttf6R2ed7H8ygIiYAMp2lfVjRKuPaRoC7vbcN+RdWFSMgnwKeA+fT33OjZpkQmklf1GsS5rm4KYWvwLh6/20RhOqExX3YNvnMgZ3Ds+oADxlNhpVAycQX+nVk5rSryjk22pOtbObSBUMqiRkXR5aaFzlXqkqi7DYu/HuUuJMSPatFGICxXqKmLP6J1cni/rORqYevtVd20k/fLQxZsh3ebQ0a1vwGO3YXvh8GuMqYgzFuIoYQxu/tiXVlgZbLWc1xHZFW6yr/O8wp++CitT0JkIEF2efc1pnXXsT6w9kxNbX3yu+UzUTF+5+p6RgUrGeIub+QbGhKR+rOgOa8mbusB4GDhQSvl1s0dDANVJ1z/kqE5vncvOIVKbtvejrVRXAV+1dJ+nF6SAeskenvlPuxzU3Ab7XWtQq6fyqrwQIBf6qAqgjOUQUUHIUTVPy128SASnIbxbfrb7nHdpoTA1xZK6iPABWUDgg0gEAAJALAJ0BKjAAMAA+nUicSyWkIqGjjPiwE4lsauxFAcCODRKOq+YJVP7R+BdoQsn5APct/jPYBtnfMb5825K+xLz2v7K/CD5SQYaWDr9n0s1beerN1R34rOJ5BUgnks51KrkiFM5AAP7g4QSdiPUFTiWqJwBR1uGcOnntvf/1/ydtY1h8J8e5u9GvZnWykreGWtZWoncJS3b2xY46Q4ivVrQisPgYf4qftvn7MkfYSVKzuFfUkOpUeYWCT7NbDH1AS02TC7OV44WdHktQstT/+NyF7CH8aouSUeJtHuj+kdcNI0nsCljM7iv4x9Acy+WhIytdxwz+6zpogUPB8/sShn0KW+Xo7lEL2Zv5+9k6wGeEPpbjQFFRobCauRLak5m5PX/qAmwz+dREZYYTJd6wQqzYPz+bKV+2NxMsdgvdSw5HEYgLcBDBZuVW73wnORVZl2lY9HL2/O420Km3vFX7FmSdmjyGe0MzHmB5Hoqku1hsSR2k0feHPTopesgToT/jchcuVacG+d3Fu7xDIDfLq0PQPC7f36og9L78NkY6Sa7S0Kto8OMlUwJ9WFpGXLaOjgS8vGm8QHsjubK9AJYIFsm9EGPRjk0qxg/i8ri+HA4yoAA=";
      img.style.cssText = `
        display: inline-block;
        width: 40px;
        height: 40px;
        z-index: 99999;
        left: 50%;
        margin-left: -18px;
        cursor: pointer;
        filter: drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.5));
        position: absolute;
        bottom: ${bottom};
      `;

      style.textContent = `@keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }`;

      img.onclick = () => {
        window.open("https://nocaptchaai.com", "_blank");
      };

      element.appendChild(img);
      element.appendChild(p);
      document.head.appendChild(style);
    });
  }
})();
