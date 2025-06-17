import { Theme } from "../types";

/**
 *
 * @param snapshotId snapshotId from tradingview
 * @returns tradingview s3 url
 */
const getPngUrlBySnapshotId = (snapshotId: string): string => {
  const subDir = snapshotId.charAt(0).toLowerCase();
  return `https://s3.tradingview.com/snapshots/${subDir}/${snapshotId}.png`;
};

function getThemeByTime(): Theme {
  // 北京时间 6:00 - 18:00
  const hour = new Date().toLocaleDateString("zh-CN", { hour12: false }).split(":")[0];
  const hourNumber = Number(hour);
  return hourNumber >= 6 && hourNumber < 18 ? "light" : "dark";
}
function convertTimeframe(
  timeframe: string
): 1 | 5 | 15 | "1H" | "1D" | "1W" | "1M" | "12M" {
  if (!timeframe) return 15;

  const input = timeframe.toString().trim();
  const lowerInput = input.toLowerCase();

  // 处理月 - 使用大写M表示
  if (/^(1M|M|month|1month)$/.test(input)) {
    return "1M";
  }
  if (/^(1min|1m|m|min|minute|1minute)$/.test(lowerInput)) {
    return 1;
  }
  if (/^(5min|5m|5minute)$/.test(lowerInput)) {
    return 5;
  }
  if (/^(15min|15m|15minute)$/.test(lowerInput)) {
    return 15;
  }

  // 处理小时
  if (/^(1h|h|hour|1hour)$/.test(lowerInput)) {
    return "1H";
  }

  // 处理天
  if (/^(1d|d|day|1day)$/.test(lowerInput)) {
    return "1D";
  }

  // 处理周
  if (/^(1w|w|week|1week)$/.test(lowerInput)) {
    return "1W";
  }

  // 处理年
  if (/^(1y|1Y|y|Y|year|1year)$/.test(lowerInput)) {
    return "12M";
  }

  // 默认返回15分钟
  return 15;
}

const getChartsURLBySymbol = async (
  symbol: string,
  timeframe: string = "15"
): Promise<string> => {
  const symbolInfo = await searchSymbol(symbol);
  if (!symbolInfo) {
    console.error("Symbol not found");
    return `https://www.tradingview.com/chart/?symbol=${symbol}&theme=${getThemeByTime()}`;
  }
  const interval = convertTimeframe(timeframe);
  return `https://www.tradingview.com/chart/?symbol=${symbolInfo.exchange}:${
    symbolInfo.symbol
  }&theme=${getThemeByTime()}&interval=${interval}`;
};

/**
 * 利用 symbol-search.tradingview.com 的 API 搜索 symbol，只返回一条结果
 * 结果的优先级为  Binance > Bybit > OKX > Bitget > MEXC
 * @param symbol
 */
const searchSymbol = async (symbol: string) => {
  const response = await fetch(
    `https://symbol-search.tradingview.com/symbol_search/v3/?text=${symbol}&hl=1&exchange=&lang=zh&search_type=undefined&domain=production&sort_by_country=CN&promo=true`,
    {
      headers: {
        accept: "*/*",
        "accept-language":
          "en-HK,en;q=0.9,zh-CN;q=0.8,zh-HK;q=0.7,zh;q=0.6,en-GB;q=0.5,en-US;q=0.4",
        origin: "https://cn.tradingview.com",
        priority: "u=1, i",
        referer: "https://cn.tradingview.com/",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      },
    }
  );
  const data = (await response.json()) as {
    symbols: { symbol: string; exchange: string }[];
  };
  const symbols = data.symbols.map((s) => {
    return {
      symbol: s.symbol.replace("<em>", "").replace("</em>", ""),
      exchange: s.exchange.toUpperCase(),
    };
  });
  const priority = [
    "BINANCE",
    "BYBIT",
    "OKX",
    "BITGET",
    "COINBASE",
    "CRYPTO",
    "MEXC",
  ];
  for (const s of symbols) {
    // 按照优先级返回
    if (priority.includes(s.exchange)) {
      return s;
    }
  }
  return symbols[0];
};

export { getPngUrlBySnapshotId, getChartsURLBySymbol, searchSymbol };
