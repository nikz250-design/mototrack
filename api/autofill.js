export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'Image requerida' });

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
        max_tokens: 600,
        system: "Eres un extractor de datos de alta precisión para Uber.",
        messages: [{
          role: 'user',
          content: [
            { type: "text", text: "Extrae fecha y total de esta captura: {\"day\":{\"date\":\"DD/MM/YYYY\",\"total\":0.0}}" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image.includes(',') ? image.split(',')[1] : image
              }
            }
          ]
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
