export default async function handler(req, res) {
  const queryString = req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
  const url = `https://api.binance.com/api/v3/ticker/24hr${queryString}`

  try {
    const response = await fetch(url)
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: text })
    }
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
