export type PairCfg = {
  pair: string;
  symbol: string;
  point: number;
  tpPoints: number;
  slPoints: number;
  digits: number;
};

export const PAIRS: PairCfg[] = [
  { pair: "EURUSD", symbol: "EUR/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "GBPUSD", symbol: "GBP/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "USDJPY", symbol: "USD/JPY", point: 0.001, tpPoints: 70, slPoints: 30, digits: 3 },
  { pair: "AUDUSD", symbol: "AUD/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "NZDUSD", symbol: "NZD/USD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "USDCAD", symbol: "USD/CAD", point: 0.00001, tpPoints: 70, slPoints: 30, digits: 5 },
  { pair: "XAUUSD", symbol: "XAU/USD", point: 0.01, tpPoints: 4300, slPoints: 2000, digits: 2 },
  { pair: "BTCUSD", symbol: "BTC/USD", point: 0.01, tpPoints: 200000, slPoints: 100000, digits: 2 },
];

export const PAIR_IDS = PAIRS.map((p) => p.pair) as [string, ...string[]];

export function getPairConfig(pair: string) {
  return PAIRS.find((p) => p.pair === pair.toUpperCase());
}