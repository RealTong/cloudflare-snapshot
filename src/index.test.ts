import { getPngUrlBySnapshotId, searchSymbol } from "./utils";
import { describe, expect, it } from "vitest";

describe("测试", () => {
  it("测试 TradingView 搜索 --- 美股", async () => {
    const symbolInfo = await searchSymbol("AAPL");
    expect(symbolInfo).toEqual({
      symbol: "AAPL",
      exchange: "NASDAQ",
    });
  });

  it("测试 TradingView 搜索 --- 加密货币", async () => {
    const symbolInfo = await searchSymbol("BTCUSDT");
    expect(symbolInfo).toEqual({
      symbol: "BTCUSDT",
      exchange: "BINANCE",
    });
  });

  it("测试 TradingView 搜索 --- 股票", async () => {
    const symbolInfo = await searchSymbol("BABA");
    expect(symbolInfo).toEqual({
      symbol: "BABA",
      exchange: "NYSE",
    });
  });
  it("测试 根据 snapshotId 获取 TradingView S3 图片 URL", async () => {
    const pngUrl = getPngUrlBySnapshotId("WR8aXAXr");
    expect(pngUrl).toEqual(
      "https://s3.tradingview.com/snapshots/w/WR8aXAXr.png"
    );
  });
});
