export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Images requeridas' });
  }

  const MODELS = [
    'claude-3-haiku-latest',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229'
  ];

  for (const model of MODELS) {

    try {

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
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

      // Si el modelo no existe o falla, intenta el siguiente
      if (data.error) {
        console.log("Modelo falló:", model, data.error);
        continue;
      }

      const text = data.content?.[0]?.text;

      if (!text) {
        continue;
      }

      let clean = text.replace(/```json|```/g, '').trim();

      try {
        const parsed = JSON.parse(clean);
        return res.status(200).json(parsed);
      } catch {
        return res.status(500).json({
          error: "Claude no devolvió JSON válido",
          raw: clean
        });
      }

    } catch (err) {
      console.log("Error con modelo:", model, err.message);
      continue;
    }
  }

  return res.status(500).json({
    error: "Ningún modelo funcionó",
    hint: "Revisa tu API key o acceso a modelos"
  });
}
