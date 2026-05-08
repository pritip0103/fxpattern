exports.handler = async (event) => {
  const { pair, interval } = event.queryStringParameters || {};
  if (!pair || !interval) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing params' }) };
  }
  const map = {
    EURUSD:['EUR','USD'],GBPUSD:['GBP','USD'],
    USDJPY:['USD','JPY'],AUDUSD:['AUD','USD'],USDCHF:['USD','CHF']
  };
  const [from, to] = map[pair] || ['EUR','USD'];
  const KEY = 'Y8DVKLIWJH7KXK0F';
  const url = `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=${interval}&outputsize=compact&apikey=${KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data['Note']||data['Information']) return {statusCode:429,headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:'Rate limit'})};
    const key = `Time Series FX (${interval})`;
    const series = data[key];
    if (!series) return {statusCode:404,headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:'No data'})};
    const candles = Object.entries(series)
      .map(([t,v])=>({t,o:+v['1. open'],h:+v['2. high'],l:+v['3. low'],c:+v['4. close']}))
      .sort((a,b)=>a.t.localeCompare(b.t)).slice(-100);
    return {statusCode:200,headers:{'Access-Control-Allow-Origin':'*','Content-Type':'application/json'},body:JSON.stringify({candles})};
  } catch(e) {
    return {statusCode:500,headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:e.message})};
  }
};
