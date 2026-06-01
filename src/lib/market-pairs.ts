export type PairCfg = {
  pair: string;
  symbol: string;
  finnhubSymbol: string;
  isCrypto?: boolean;
  point: number;
  tpPoints: number;
  slPoints: number;
  digits: number;
};

export const PAIRS: PairCfg[] = [
  { pair: "EURUSD", symbol: "EUR/USD", finnhubSymbol: "OANDA:EUR_USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "GBPUSD", symbol: "GBP/USD", finnhubSymbol: "OANDA:GBP_USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "USDJPY", symbol: "USD/JPY", finnhubSymbol: "OANDA:USD_JPY", point: 0.001, tpPoints: 70, slPoints: 30, digits: 3 },
  { pair: "AUDUSD", symbol: "AUD/USD", finnhubSymbol: "OANDA:AUD_USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "NZDUSD", symbol: "NZD/USD", finnhubSymbol: "OANDA:NZD_USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "USDCAD", symbol: "USD/CAD", finnhubSymbol: "OANDA:USD_CAD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "XAUUSD", symbol: "XAU/USD", finnhubSymbol: "OANDA:XAU_USD", point: 0.01, tpPoints: 4300, slPoints: 2000, digits: 2 },
  { pair: "BTCUSD", symbol: "BTC/USD", finnhubSymbol: "BINANCE:BTCUSDT", isCrypto: true, point: 0.01, tpPoints: 200000, slPoints: 100000, digits: 2 },
];

export const PAIR_IDS = PAIRS.map((p) => p.pair) as [string, ...string[]];

export function getPairConfig(pair: string) {
  return PAIRS.find((p) => p.pair === pair.toUpperCase());
}