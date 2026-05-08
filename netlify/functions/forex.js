exports.handler = async (event) => {
  const { pair, interval } = event.queryStringParameters || {};
  if (!pair || !interval) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing params' }) };
  }

  // Twelve Data symbol format: EUR/USD
  const symbolMap = {
    EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD',
    USDJPY: 'USD/JPY', AUDUSD: 'AUD/USD', USDCHF: 'USD/CHF'
  };
  const symbol = symbolMap[pair] || 'EUR/USD';

  // Twelve Data interval format: 1min, 5min, 15min, 1h
  const intervalMap = {
    '1min': '1min', '5min': '5min', '15min': '15min', '60min': '1h'
  };
  const tdInterval = intervalMap[interval] || '5min';

  const KEY = 'f8d244d577e143469d77235e4b74c5fa';
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=150&apikey=${KEY}&format=JSON`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'error') {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.message || 'API error' })
      };
    }

    if (!data.values || !data.values.length) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No data — market may be closed' })
      };
    }

    // Parse into candles — Twelve Data returns newest first, so reverse
    const candles = data.values
      .map(v => ({
        t: v.datetime,
        o: parseFloat(v.open),
        h: parseFloat(v.high),
        l: parseFloat(v.low),
        c: parseFloat(v.close)
      }))
      .reverse();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ candles, meta: data.meta })
    };

  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
