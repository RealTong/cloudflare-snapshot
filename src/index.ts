import { Hono } from "hono";
import puppeteer from "@cloudflare/puppeteer";
import type { Fetcher } from "@cloudflare/workers-types";
import { getChartsURLBySymbol, getPngUrlBySnapshotId } from "./utils";

type Bindings = {
  BROWSER: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/snapshot", async (c) => {
  const { symbol, timeframe } = await c.req.query();
  if (!symbol || !timeframe) {
    return c.json({ success: false, message: "Missing symbol or timeframe" });
  }
  const browser = await puppeteer.launch(c.env.BROWSER as any);
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    const window = globalThis;
    window.localStorage.setItem(
      "tradingview.cyber_monday.show_popup_2024",
      "true"
    );
    window.localStorage.setItem(
      "tradingview.chartproperties",
      '{"timezone":"Asia/Hong_Kong","priceScaleSelectionStrategyName":"auto","paneProperties":{"backgroundType":"solid","gridLinesMode":"both","vertGridProperties":{"style":0,"color":"rgba(42, 46, 57, 0.06)"},"horzGridProperties":{"style":0,"color":"rgba(42, 46, 57, 0.06)"},"crossHairProperties":{"style":2,"transparency":0,"width":1,"color":"#9598A1"},"topMargin":10,"bottomMargin":8,"axisProperties":{"autoScale":true,"autoScaleDisabled":false,"lockScale":false,"percentage":false,"percentageDisabled":false,"indexedTo100":false,"log":false,"logDisabled":false,"alignLabels":true,"isInverted":false},"legendProperties":{"showStudyArguments":true,"showStudyTitles":true,"showStudyValues":true,"showSeriesTitle":true,"showSeriesOHLC":true,"showLegend":true,"showLastDayChange":false,"showBarChange":true,"showVolume":false,"showBackground":true,"showPriceSource":true,"backgroundTransparency":50,"showLogo":true,"showTradingButtons":true,"showTradingButtonsMobile":true},"separatorColor":"#E0E3EB","background":"#ffffff","backgroundGradientStartColor":"#ffffff","backgroundGradientEndColor":"#ffffff"},"scalesProperties":{"fontSize":12,"scaleSeriesOnly":false,"showSeriesLastValue":true,"seriesLastValueMode":1,"showSeriesPrevCloseValue":false,"showStudyLastValue":true,"showSymbolLabels":false,"showStudyPlotLabels":false,"showBidAskLabels":false,"showPrePostMarketPriceLabel":true,"showFundamentalNameLabel":false,"showFundamentalLastValue":true,"barSpacing":6,"saveLeftEdge":false,"textColor":"#131722","lineColor":"rgba(42, 46, 57, 0)","backgroundColor":"#ffffff"},"chartEventsSourceProperties":{"visible":true,"futureOnly":true,"breaks":{"color":"#555555","visible":false,"style":2,"width":1}},"tradingProperties":{"showPositions":true,"positionPL":{"visibility":true,"display":0},"bracketsPL":{"visibility":true,"display":0},"showOrders":true,"showExecutions":true,"showExecutionsLabels":false,"showReverse":true,"horizontalAlignment":2,"extendLeft":true,"lineLength":5,"lineWidth":1,"lineStyle":0},"volumePaneSize":"large"}'
    );
  });
  await page.goto(await getChartsURLBySymbol(symbol, timeframe));
  await page.keyboard.down("Alt");
  await page.keyboard.press("s");
  await page.keyboard.up("Alt");
  const copyButtonResponse = await page.waitForResponse(
    (response) =>
      response.url() === "https://www.tradingview.com/snapshot/" &&
      response.status() === 200
  );
  const snapshotId = await copyButtonResponse.text();
  await browser.close();
  const pngUrl = getPngUrlBySnapshotId(snapshotId);
  const img = await fetch(pngUrl).then((res) => res.body);
  return new Response(img, {
    headers: {
      "content-type": "image/png",
    },
  });
  // return c.json({ success: true, symbol, timeframe, snapshotId });
});

export default app;
