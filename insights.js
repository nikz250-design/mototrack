export default async function handler(req, res) {
  const { stats } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analiza estos datos: ${JSON.stringify(stats)}`
        }]
      })
    });

    const data = await response.json();
    res.json({ insights: data.content[0].text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
