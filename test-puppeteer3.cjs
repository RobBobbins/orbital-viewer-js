const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", error => console.log("PAGE ERROR:", error.message));
  await page.goto("http://127.0.0.1:8081/examples/index.html");
  await new Promise(r => setTimeout(r, 2000));
  const html = await page.evaluate(() => document.querySelector("#orbital-gallery").innerHTML);
  console.log("GALLERY HTML:", html.length > 0 ? "Has innerHTML" : "Empty");
  await browser.close();
})();
