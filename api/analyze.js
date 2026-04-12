export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { images } = req.body;
  if (!images || !Array.isArray(images)) return res.status(400).json({ error: 'Images requeridas' });

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
        max_tokens: 1200,
        system: "Extrae datos de capturas de Uber. Responde exclusivamente con JSON válido. No incluyas explicaciones.",
        messages: [{
          role: 'user',
          content: [
            { type: "text", text: "Analiza estas capturas y devuelve los totales por día: {\"days\":[{\"date\":\"DD/MM/YYYY\",\"total\":100.00}]}" },
            ...images.map(img => ({
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                // Limpia el prefijo data:image/... si el frontend lo envía
                data: img.source.data.includes(',') ? img.source.data.split(',')[1] : img.source.data
              }
            }))
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Error de Anthropic");

    const text = data.content?.[0]?.text;
    if (!text) return res.status(500).json({ error: "Claude no devolvió contenido" });

    const clean = text.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
