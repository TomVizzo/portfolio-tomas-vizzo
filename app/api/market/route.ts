import { NextResponse } from "next/server";

type DollarQuote = {
  compra: number;
  venta: number;
  fechaActualizacion: string;
};

type MarketAsset = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
};

type MarketSummary = {
  indices?: Array<{
    symbol: string;
    value: number;
    changePercent: number;
    timestamp: string;
  }>;
  topGainers?: MarketAsset[];
  topLosers?: MarketAsset[];
  mostActive?: MarketAsset[];
  lastUpdate?: string;
};

const preferredSymbols = ["YPFD", "GGAL", "PAMP"];

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(7000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Fuente no disponible: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function GET() {
  const [blueResult, officialResult, marketResult] = await Promise.allSettled([
    readJson<DollarQuote>("https://dolarapi.com/v1/dolares/blue"),
    readJson<DollarQuote>("https://dolarapi.com/v1/dolares/oficial"),
    readJson<MarketSummary>("https://rosariofinanzas.ar/api/market/summary"),
  ]);

  const blue = blueResult.status === "fulfilled" ? blueResult.value : null;
  const official = officialResult.status === "fulfilled" ? officialResult.value : null;
  const market = marketResult.status === "fulfilled" ? marketResult.value : null;

  if (!blue && !official && !market) {
    return NextResponse.json(
      { error: "Las cotizaciones no están disponibles temporalmente." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const assetMap = new Map<string, MarketAsset>();
  [...(market?.mostActive ?? []), ...(market?.topGainers ?? []), ...(market?.topLosers ?? [])]
    .forEach((asset) => assetMap.set(asset.symbol, asset));

  const preferred = preferredSymbols
    .map((symbol) => assetMap.get(symbol))
    .filter((asset): asset is MarketAsset => Boolean(asset));
  const remaining = [...assetMap.values()].filter(
    (asset) => !preferred.some((preferredAsset) => preferredAsset.symbol === asset.symbol),
  );

  const response = NextResponse.json({
    dollar: {
      blue: blue ? { buy: blue.compra, sell: blue.venta } : null,
      official: official ? { buy: official.compra, sell: official.venta } : null,
    },
    index: market?.indices?.[0]
      ? {
          symbol: market.indices[0].symbol,
          value: market.indices[0].value,
          changePercent: market.indices[0].changePercent,
        }
      : null,
    stocks: [...preferred, ...remaining].slice(0, 3).map((asset) => ({
      symbol: asset.symbol === "YPFD" ? "YPF" : asset.symbol,
      name: asset.name,
      price: asset.price,
      changePercent: asset.changePercent,
    })),
    updatedAt:
      market?.lastUpdate ??
      blue?.fechaActualizacion ??
      official?.fechaActualizacion ??
      new Date().toISOString(),
  });

  response.headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  return response;
}
