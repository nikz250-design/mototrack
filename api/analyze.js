export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Images requeridas' });
  }

  try {

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: `
Analiza estas capturas de Uber.

Responde SOLO JSON válido:

{"days":[{"date":"DD/MM/YYYY","total":1000}]}
`
              },
              ...images.map(img => ({
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: img.source.data
                }
              }))
            ]
          }
        ]
      })
    });

    const data = await response.json();

    console.log("CLAUDE RAW:", JSON.stringify(data));

    const text = data.content?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "Claude no respondió",
        raw: data
      });
    }

    let clean = text.replace(/```json|```/g, '').trim();

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      return res.status(500).json({
        error: "JSON inválido",
        raw: clean
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
