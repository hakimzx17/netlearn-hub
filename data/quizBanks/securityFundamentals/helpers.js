const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

export function q(id, question, options, correctIndex, difficulty, explanation) {
  const optionExplanations = Array(options.length).fill('');
  optionExplanations[correctIndex] = explanation;

  return {
    id,
    question,
    options,
    correctIndex,
    difficulty,
    optionExplanations,
  };
}

function toOptions(options) {
  return options.map((text, index) => ({
    id: LETTERS[index],
    text,
  }));
}

export function single(id, topicId, question, options, correctIndex, difficulty, explanation) {
  return {
    id,
    domain: 5,
    topicId,
    type: 'single',
    difficulty,
    question,
    options: toOptions(options),
    correct: LETTERS[correctIndex],
    explanation,
  };
}

export function multi(id, topicId, question, options, correctIndices, difficulty, explanation) {
  return {
    id,
    domain: 5,
    topicId,
    type: 'multi',
    difficulty,
    question,
    options: toOptions(options),
    correct: correctIndices.map((index) => LETTERS[index]),
    explanation,
  };
}

export function order(id, topicId, question, items, correct, difficulty, explanation) {
  return {
    id,
    domain: 5,
    topicId,
    type: 'order',
    difficulty,
    question,
    items: items.map(([itemId, text]) => ({ id: itemId, text })),
    correct,
    explanation,
  };
}
