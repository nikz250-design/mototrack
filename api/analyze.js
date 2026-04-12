export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Images requeridas' });
  }

  try {

    const prompt = `
Analiza estas capturas de pantalla de ganancias de Uber.

Responde SOLO con JSON válido, sin texto adicional.

Formato:
{"days":[
  {
    "date":"DD/MM/YYYY",
    "day_name":"Lun",
    "hours_connected":10.5,
    "trips":18,
    "tarifa_neta":655.51,
    "incentivos":695.00,
    "propinas":158.65,
    "impuestos":121.86,
    "total":1387.30
  }
]}
`;

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
              ...images,
              { type: 'text', text: prompt }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    let text = data.content?.map(c => c.text || '').join('') || '';

    console.log("RAW CLAUDE:", text);

    // =============================
    // 🔥 LIMPIEZA DE JSON (FIX CLAVE)
    // =============================
    let clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const jsonStart = clean.indexOf('{');
    const jsonEnd = clean.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1) {
      clean = clean.substring(jsonStart, jsonEnd + 1);
    }

    let parsed;

    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("❌ JSON ERROR:", clean);
      return res.status(500).json({
        error: "Claude no devolvió JSON válido",
        raw: clean
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
