const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8081/examples/index.html");
  await new Promise(r => setTimeout(r, 2000));
  
  const isBlank = await page.evaluate(() => {
    const canvas = document.querySelector(".gallery-thumb canvas");
    if (!canvas) return "No canvas found";
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0,0,10,10).data;
    let sum = 0;
    for(let i=0; i<data.length; i++) sum += data[i];
    return sum === 0 ? "Blank (all 0s)" : `Has data: ${sum}`;
  });
  console.log("Canvas status:", isBlank);

  await browser.close();
})();
