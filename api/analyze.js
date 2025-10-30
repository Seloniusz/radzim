// api/analyze.js
const { formidable } = require('formidable');
const fs = require('fs').promises;
const axios = require('axios');
const cheerio = require('cheerio');

// Dla Vercel - wyłącz bodyParser
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  console.log('=== START REQUEST ===');

  try {
    // Parsowanie formularza
    console.log('Parsing form...');
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          reject(err);
        }
        console.log('Form parsed successfully');
        resolve([fields, files]);
      });
    });

    console.log('Fields:', fields);
    console.log('Files:', Object.keys(files));

    const jobUrl = Array.isArray(fields.jobUrl) ? fields.jobUrl[0] : fields.jobUrl;
    const cvFile = Array.isArray(files.cv) ? files.cv[0] : files.cv;

    if (!jobUrl || !cvFile) {
      throw new Error('Brak wymaganych danych (jobUrl lub cv)');
    }

    console.log('Job URL:', jobUrl);
    console.log('CV file:', cvFile.originalFilename, cvFile.mimetype);

    // 1. Pobierz ofertę pracy
    console.log('Fetching job offer...');
    const jobDescription = await scrapeJobOffer(jobUrl);
    console.log('Job description length:', jobDescription.length);

    // 2. Odczytaj CV
    console.log('Reading CV...');
    const cvContent = await extractCVText(cvFile);
    console.log('CV content length:', cvContent.length);

    // 3. Analiza AI
    console.log('Analyzing with AI...');
    const analysis = await analyzeWithAI(jobDescription, cvContent);
    console.log('Analysis complete');

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      error: error.message || 'Wystąpił nieznany błąd',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

async function scrapeJobOffer(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    
    // Usuń niepotrzebne elementy
    $('script, style, nav, header, footer, iframe, noscript').remove();
    
    // Pobierz główny tekst
    let text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();

    // Ogranicz długość
    if (text.length > 8000) {
      text = text.substring(0, 8000);
    }

    if (text.length < 100) {
      throw new Error('Zbyt mało treści pobranej ze strony oferty');
    }

    return text;
  } catch (error) {
    console.error('Scrape error:', error.message);
    throw new Error(`Nie udało się pobrać oferty: ${error.message}`);
  }
}

async function extractCVText(file) {
  try {
    const fileBuffer = await fs.readFile(file.filepath);
    
    // PDF
    if (file.mimetype === 'application/pdf' || file.originalFilename?.endsWith('.pdf')) {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(fileBuffer);
        return data.text || '';
      } catch (error) {
        console.error('PDF parse error:', error);
        throw new Error('Nie udało się odczytać PDF');
      }
    }
    
    // DOCX
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.originalFilename?.endsWith('.docx')) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        return result.value || '';
      } catch (error) {
        console.error('DOCX parse error:', error);
        throw new Error('Nie udało się odczytać DOCX');
      }
    }

    // DOC (stary format)
    if (file.mimetype === 'application/msword' || file.originalFilename?.endsWith('.doc')) {
      throw new Error('Format .doc nie jest obsługiwany. Użyj .docx lub .pdf');
    }

    throw new Error(`Nieobsługiwany format: ${file.mimetype}`);
  } catch (error) {
    console.error('Extract text error:', error);
    throw new Error(`Błąd odczytu CV: ${error.message}`);
  }
}

async function analyzeWithAI(jobDescription, cvContent) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('Brak klucza OPENAI_API_KEY w zmiennych środowiskowych');
  }

  if (!cvContent || cvContent.trim().length < 50) {
    throw new Error('CV jest puste lub zbyt krótkie');
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    throw new Error('Opis oferty jest pusty lub zbyt krótki');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem HR i career coachem. Pomagasz kandydatom dostosować CV do konkretnych ofert pracy. Piszesz po polsku, konkretnie i rzeczowo.'
          },
          {
            role: 'user',
            content: `Przeanalizuj CV kandydata względem oferty pracy i podaj konkretne rekomendacje.

OFERTA PRACY:
${jobDescription.substring(0, 6000)}

CV KANDYDATA:
${cvContent.substring(0, 6000)}

Przeanalizuj i podaj:
1. **Dopasowanie ogólne** - na ile CV pasuje do oferty (%)
2. **Co jest OK** - jakie wymagania kandydat spełnia
3. **Czego brakuje** - kluczowe braki w CV względem oferty
4. **Konkretne zmiany** - co dodać/zmienić w CV (punkty)
5. **Słowa kluczowe** - jakie buzzwords dodać

Odpowiedź w języku polskim, maksymalnie 1500 znaków.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Nieprawidłowy klucz OpenAI API');
    }
    if (error.response?.status === 429) {
      throw new Error('Przekroczono limit zapytań OpenAI. Spróbuj za chwilę.');
    }
    
    throw new Error(`Błąd OpenAI: ${error.response?.data?.error?.message || error.message}`);
  }
}