export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { stats } = req.body;
  if (!stats) return res.status(400).json({ error: 'Faltan datos de stats' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Analiza estos ingresos de Uber: ${JSON.stringify(stats)}. Genera 3 insights breves y accionables. Responde solo JSON: {"insights":[{"title":"...","description":"..."}]}`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text;
    const clean = text.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
