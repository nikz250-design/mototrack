export default async function handler(req, res) {
  const { image } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: image }
            },
            { type: 'text', text: 'Extrae datos en JSON' }
          ]
        }]
      })
    });

    const data = await response.json();
    res.json(JSON.parse(data.content[0].text));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
