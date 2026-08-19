const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", error => console.log("PAGE ERROR:", error.message));
  page.on("requestfailed", request => console.log("REQUEST FAILED:", request.url(), request.failure()?.errorText));
  await page.goto("http://127.0.0.1:8081/examples/index.html");
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.evaluate(() => document.querySelector("#gallery").innerHTML);
  console.log("GALLERY HTML:", html);
  await browser.close();
})();
