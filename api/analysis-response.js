const REQUIRED_LIST_FIELDS = [
  'whatWorks',
  'whatsMissing',
  'concreteChanges'
];

function findJSONObject(content) {
  let startIndex = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        startIndex = index;
      }

      depth += 1;
      continue;
    }

    if (char === '}' && depth > 0) {
      depth -= 1;

      if (depth === 0) {
        return content.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function validateAnalysis(analysis) {
  const isValidPercentage =
    Number.isFinite(analysis?.matchPercentage) &&
    analysis.matchPercentage >= 0 &&
    analysis.matchPercentage <= 100;
  const hasValidLists = REQUIRED_LIST_FIELDS.every(
    field => Array.isArray(analysis?.[field]) &&
      analysis[field].every(item => typeof item === 'string')
  );
  const hasValidKeywords = Array.isArray(analysis?.keywords) &&
    analysis.keywords.every(
      keyword => typeof keyword?.term === 'string' &&
        typeof keyword?.url === 'string'
    );
  const hasValidSkillRatings = analysis?.skillRatings === undefined || (
    Array.isArray(analysis.skillRatings) &&
    analysis.skillRatings.length >= 4 &&
    analysis.skillRatings.length <= 6 &&
    analysis.skillRatings.every(
      skill => typeof skill?.label === 'string' &&
        Number.isInteger(skill?.score) &&
        skill.score >= 1 &&
        skill.score <= 5
    )
  );

  if (!isValidPercentage || !hasValidLists || !hasValidKeywords || !hasValidSkillRatings) {
    throw new Error('OpenRouter zwrócił nieprawidłowy format analizy. Spróbuj ponownie.');
  }

  return analysis;
}

function normalizeAnalysisContent(content) {
  const jsonContent = findJSONObject(String(content || ''));

  if (!jsonContent) {
    throw new Error('OpenRouter zwrócił nieprawidłowy format analizy. Spróbuj ponownie.');
  }

  try {
    return JSON.stringify(validateAnalysis(JSON.parse(jsonContent)), null, 2);
  } catch (error) {
    if (error.message.startsWith('OpenRouter zwrócił')) {
      throw error;
    }

    throw new Error('OpenRouter zwrócił nieprawidłowy format analizy. Spróbuj ponownie.');
  }
}

module.exports = {
  normalizeAnalysisContent
};
