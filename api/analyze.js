// api/analyze.js
const { formidable } = require('formidable');
const fs = require('fs').promises;
const axios = require('axios');
const { normalizeAnalysisContent } = require('./analysis-response');
const { scrapeJobOffer } = require('./job-offer');

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
  const temporaryFilepaths = [];

  try {
    // Parsowanie formularza
    console.log('Parsing form...');
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    });

    form.on('fileBegin', (_, file) => {
      temporaryFilepaths.push(file.filepath);
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

    const jobUrl = Array.isArray(fields.jobUrl) ? fields.jobUrl[0] : fields.jobUrl;
    const cvFile = Array.isArray(files.cv) ? files.cv[0] : files.cv;

    if (!jobUrl || !cvFile) {
      throw new Error('Brak wymaganych danych (jobUrl lub cv)');
    }

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
    console.error('Analysis request failed:', error.message);
    
    return res.status(500).json({ 
      error: error.message || 'Wystąpił nieznany błąd',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    await Promise.all(
      temporaryFilepaths.map(async filepath => {
        try {
          await fs.unlink(filepath);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error('Temporary CV cleanup failed:', error.message);
          }
        }
      })
    );
  }
};

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


const CV_ANALYSIS_CHAR_LIMIT = Number.parseInt(process.env.CV_ANALYSIS_CHAR_LIMIT || '9000', 10);
const JOB_ANALYSIS_CHAR_LIMIT = Number.parseInt(process.env.JOB_ANALYSIS_CHAR_LIMIT || '8000', 10);
const OPENROUTER_TIMEOUT_MS = 90000;

const LOW_VALUE_CV_PATTERNS = [
  /wyrażam zgodę/i,
  /wyrazam zgode/i,
  /przetwarzanie danych osobowych/i,
  /rodo/i,
  /gdpr/i,
  /references available/i,
  /^curriculum vitae$/i,
  /^page \d+ of \d+$/i,
  /^strona \d+ z \d+$/i,
  /^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i,
  /^\+?\d[\d\s().-]{7,}$/
];

const CV_SECTION_RULES = [
  {
    key: 'summary',
    label: 'Podsumowanie / profil',
    priority: 1,
    heading: /^(podsumowanie|profil|o mnie|summary|profile|about me|professional summary)\b/i
  },
  {
    key: 'experience',
    label: 'Doświadczenie zawodowe',
    priority: 2,
    heading: /^(doświadczenie zawodowe|doswiadczenie zawodowe|work experience|historia zatrudnienia|praca zawodowa|doświadczenie|doswiadczenie|experience|employment)\b/i
  },
  {
    key: 'projects',
    label: 'Projekty',
    priority: 3,
    heading: /^(projekty|projects|portfolio|selected projects|wybrane projekty)\b/i
  },
  {
    key: 'skills',
    label: 'Umiejętności / technologie',
    priority: 4,
    heading: /^(umiejętności|umiejetnosci|kompetencje|technologie|skills|technical skills|tech stack|stack|narzędzia|narzedzia)\b/i
  },
  {
    key: 'certifications',
    label: 'Certyfikaty / kursy',
    priority: 5,
    heading: /^(certyfikaty|certificates|certifications|kursy|courses|szkolenia|training)\b/i
  },
  {
    key: 'education',
    label: 'Edukacja',
    priority: 6,
    heading: /^(edukacja|wykształcenie|wyksztalcenie|education|studia|university)\b/i
  },
  {
    key: 'languages',
    label: 'Języki',
    priority: 7,
    heading: /^(języki|jezyki|languages|language skills)\b/i
  }
];

const STOPWORDS = new Set([
  'oraz', 'albo', 'jest', 'dla', 'jak', 'lub', 'the', 'and', 'with', 'from', 'that', 'this',
  'praca', 'pracy', 'oferta', 'firmy', 'firma', 'candidate', 'requirements', 'experience',
  'minimum', 'mile', 'widziane', 'będzie', 'bedzie', 'about', 'your', 'you', 'are', 'will'
]);

function normalizeText(text) {
  return String(text || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\s+(?=(podsumowanie|profil|o mnie|summary|profile|doświadczenie|doswiadczenie|experience|projekty|projects|umiejętności|umiejetnosci|skills|edukacja|education|certyfikaty|certifications|języki|jezyki|languages|wyrażam zgodę|wyrazam zgode|przetwarzanie danych osobowych|rodo|gdpr)(?:\s|:|$))/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncateToWordBoundary(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return `${truncated.slice(0, lastSpace > 200 ? lastSpace : maxLength).trim()}…`;
}

function normalizeLine(line) {
  return line
    .replace(/^[•·*\-–—]+\s*/, '')
    .replace(/[:：]+$/, '')
    .trim();
}

function containsLikelyPhoneNumber(text) {
  const match = text.match(/(?:\+\d{1,3}[\s().-]*)?(?:\d[\s().-]*){9,}/);
  return Boolean(match && match[0].replace(/\D/g, '').length >= 9);
}

function isLowValueCVLine(line) {
  const trimmed = line.trim();
  const containsContact = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(trimmed) || containsLikelyPhoneNumber(trimmed);

  return LOW_VALUE_CV_PATTERNS.some(pattern => pattern.test(trimmed)) || (containsContact && trimmed.length < 180);
}

function getSectionMatch(line) {
  const normalized = normalizeLine(line);

  if (!normalized || normalized.length > 220) {
    return null;
  }

  for (const rule of CV_SECTION_RULES) {
    const match = normalized.match(rule.heading);

    if (match) {
      return {
        rule,
        remainder: normalized.slice(match[0].length).replace(/^[\s:：–—-]+/, '').trim()
      };
    }
  }

  return null;
}

function splitCVIntoSections(cvText) {
  const sections = new Map();
  let currentKey = 'other';

  sections.set('other', {
    key: 'other',
    label: 'Inne istotne informacje',
    priority: 99,
    lines: []
  });

  for (const rawLine of normalizeText(cvText).split('\n')) {
    const line = normalizeLine(rawLine);

    if (!line || isLowValueCVLine(line)) {
      continue;
    }

    const sectionMatch = getSectionMatch(line);

    if (sectionMatch) {
      currentKey = sectionMatch.rule.key;

      if (!sections.has(currentKey)) {
        sections.set(currentKey, {
          key: sectionMatch.rule.key,
          label: sectionMatch.rule.label,
          priority: sectionMatch.rule.priority,
          lines: []
        });
      }

      if (sectionMatch.remainder && !isLowValueCVLine(sectionMatch.remainder)) {
        sections.get(currentKey).lines.push(sectionMatch.remainder);
      }

      continue;
    }

    sections.get(currentKey).lines.push(line);
  }

  return Array.from(sections.values()).filter(section => section.lines.length > 0);
}

function extractJobKeywords(jobDescription) {
  const words = normalizeText(jobDescription)
    .toLowerCase()
    .match(/[a-ząćęłńóśźż0-9+#./-]{3,}/gi) || [];

  const counts = new Map();

  for (const word of words) {
    const normalized = word.replace(/^[^a-ząćęłńóśźż0-9+#]+|[^a-ząćęłńóśźż0-9+#]+$/gi, '');

    if (!normalized || STOPWORDS.has(normalized) || normalized.length < 3) {
      continue;
    }

    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  return new Set(
    Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80)
      .map(([word]) => word)
  );
}

function scoreCVLine(line, jobKeywords) {
  const lower = line.toLowerCase();
  let score = 0;

  for (const keyword of jobKeywords) {
    if (lower.includes(keyword)) {
      score += 3;
    }
  }

  if (/\b(19|20)\d{2}\b/.test(line)) score += 1;
  if (/\b\d+[%+]?\b/.test(line)) score += 1;
  if (/[A-Z][a-zA-Z]+\.?js\b|\b(react|node|python|java|sql|aws|azure|docker|kubernetes|typescript|javascript|cypress|selenium|jira|scrum|agile|ci\/cd)\b/i.test(line)) score += 2;
  if (/\b(wdrożyłem|wdrozylem|zbudowałem|zbudowalem|prowadziłem|prowadzilem|managed|built|implemented|delivered|improved|reduced|increased)\b/i.test(line)) score += 2;

  return score;
}

function selectSectionLines(section, jobKeywords, charBudget) {
  const lineLimit = Math.max(500, Math.min(1200, Math.floor(charBudget / 2)));
  const lines = section.lines.map(line => truncateToWordBoundary(line, lineLimit));
  const fullText = lines.join('\n');

  if (fullText.length <= charBudget) {
    return fullText;
  }

  const selectedIndexes = new Set();
  const mandatoryCount = section.key === 'summary' ? 4 : 2;

  for (let i = 0; i < Math.min(mandatoryCount, lines.length); i += 1) {
    if ((lines[i].length + 1) <= charBudget) {
      selectedIndexes.add(i);
    }
  }

  const scoredLines = lines
    .map((line, index) => ({ line, index, score: scoreCVLine(line, jobKeywords) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  let currentLength = Array.from(selectedIndexes)
    .reduce((length, index) => length + lines[index].length + 1, 0);

  for (const item of scoredLines) {
    if (selectedIndexes.has(item.index) || item.score <= 0) {
      continue;
    }

    const nextLength = currentLength + item.line.length + 1;

    if (nextLength > charBudget) {
      continue;
    }

    selectedIndexes.add(item.index);
    currentLength = nextLength;
  }

  return Array.from(selectedIndexes)
    .sort((a, b) => a - b)
    .map(index => lines[index])
    .join('\n');
}

function prepareCVForAnalysis(cvText, jobDescription) {
  const maxChars = Number.isFinite(CV_ANALYSIS_CHAR_LIMIT) ? CV_ANALYSIS_CHAR_LIMIT : 9000;
  const jobKeywords = extractJobKeywords(jobDescription);
  const rawSections = splitCVIntoSections(cvText);
  const hasNamedSections = rawSections.some(section => section.key !== 'other');
  const sections = rawSections
    .map(section => {
      if (section.key !== 'other' || !hasNamedSections) {
        return section;
      }

      return {
        ...section,
        lines: section.lines.filter(line => scoreCVLine(line, jobKeywords) > 0)
      };
    })
    .filter(section => section.lines.length > 0)
    .sort((a, b) => a.priority - b.priority);

  const parts = [];
  let remainingChars = Math.max(maxChars, 2000);

  for (const section of sections) {
    const header = `## ${section.label}`;
    const sectionBudget = remainingChars - header.length - 2;

    if (sectionBudget < 300) {
      break;
    }

    const body = selectSectionLines(section, jobKeywords, sectionBudget);

    if (!body) {
      continue;
    }

    const part = `${header}\n${body}`;
    parts.push(part);
    remainingChars -= part.length + 2;
  }

  if (parts.length === 0) {
    return normalizeText(cvText).slice(0, maxChars);
  }

  return parts.join('\n\n');
}

function prepareJobForAnalysis(jobDescription) {
  const maxChars = Number.isFinite(JOB_ANALYSIS_CHAR_LIMIT) ? JOB_ANALYSIS_CHAR_LIMIT : 8000;
  return normalizeText(jobDescription).slice(0, Math.max(maxChars, 2000));
}

async function analyzeWithAI(jobDescription, cvContent) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free';
  const APP_URL = process.env.APP_URL || 'https://radzim.app';

  if (!OPENROUTER_API_KEY) {
    throw new Error('Brak klucza OPENROUTER_API_KEY w zmiennych środowiskowych');
  }

  if (!cvContent || cvContent.trim().length < 50) {
    throw new Error('CV jest puste lub zbyt krótkie');
  }

  if (!jobDescription || jobDescription.trim().length < 50) {
    throw new Error('Opis oferty jest pusty lub zbyt krótki');
  }

  const jobForAnalysis = prepareJobForAnalysis(jobDescription);
  const cvForAnalysis = prepareCVForAnalysis(cvContent, jobDescription);
  console.log('Prepared job length:', jobForAnalysis.length);
  console.log('Prepared CV length:', cvForAnalysis.length);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem HR i career coachem. Pomagasz kandydatom dostosować CV do konkretnych ofert pracy. Piszesz po polsku, konkretnie i rzeczowo. Zwracasz wyłącznie poprawny JSON.'
          },
          {
            role: 'user',
            content: `Przeanalizuj CV kandydata względem oferty pracy i podaj konkretne rekomendacje w formacie JSON.

OFERTA PRACY:
${jobForAnalysis}

CV KANDYDATA — wybrane najważniejsze sekcje z pełnego CV:
${cvForAnalysis}

Odpowiedz w formacie JSON:
{
  "matchPercentage": 85,
  "whatWorks": ["punkt 1", "punkt 2", "punkt 3"],
  "whatsMissing": ["punkt 1", "punkt 2"],
  "concreteChanges": ["punkt 1", "punkt 2", "punkt 3"],
  "keywords": [
    {"term": "Agile", "url": "https://agilealliance.org/agile101/agile-glossary/"},
    {"term": "CI/CD", "url": "https://www.atlassian.com/devops/continuous-delivery-tutorials/continuous-integration"},
    {"term": "Test Automation", "url": "https://glossary.istqb.org"}
  ],
  "skillRatings": [
    {"label": "Kompetencja dopasowana do oferty", "score": 4},
    {"label": "Inna ważna kompetencja", "score": 3},
    {"label": "Trzecia kompetencja", "score": 5},
    {"label": "Czwarta kompetencja", "score": 2}
  ]
}

Zwróć uwagę:
- matchPercentage: liczba 0-100
- whatWorks: lista umiejętności które kandydat spełnia
- whatsMissing: lista kluczowych braków
- concreteChanges: konkretne propozycje zmian w CV
- keywords: słowa kluczowe z URL do profesjonalnych źródeł (Agile Alliance, ISTQB, Atlassian, itp.)
- skillRatings: 4-6 najważniejszych kompetencji, które dobierz dynamicznie do analizowanej oferty
- skillRatings[].label: krótka nazwa kompetencji
- skillRatings[].score: liczba całkowita 1-5 określająca siłę dowodów w CV

Maksymalnie 8-10 punktów łącznie. Odpowiedź tylko JSON, bez dodatkowego tekstu.`
          }
        ],
        temperature: 0.4,
        max_tokens: 1500,
        reasoning: { effort: 'none', exclude: true },
        provider: { zdr: true }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': APP_URL,
          'X-Title': 'Radzim'
        },
        timeout: OPENROUTER_TIMEOUT_MS
      }
    );

    return normalizeAnalysisContent(response.data.choices[0].message.content);
  } catch (error) {
    console.error('OpenRouter request failed:', error.response?.status || error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Nieprawidłowy klucz OpenRouter API');
    }
    if (error.response?.status === 402) {
      throw new Error('OpenRouter odrzucił zapytanie przez limit lub brak dostępnych środków');
    }
    if (error.response?.status === 429) {
      throw new Error('Przekroczono limit zapytań darmowego modelu OpenRouter. Spróbuj za chwilę.');
    }
    
    throw new Error(`Błąd OpenRouter: ${error.response?.data?.error?.message || error.message}`);
  }
}
