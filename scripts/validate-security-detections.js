const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const rulesPath = path.join(root, 'security', 'detections', 'rules.yaml');
const detectionsDir = path.join(root, 'security', 'detections');

function readRules() {
  const content = fs.readFileSync(rulesPath, 'utf8');
  return [...content.matchAll(
    /  - id: ([^\r\n]+)\r?\n([\s\S]*?)(?=\r?\n  - id:|\r?\n?$)/g,
  )].map((match) => {
    const values = Object.fromEntries(
      [...match[2].matchAll(/    ([a-z_]+): ([^\r\n]+)/g)].map((value) => [
        value[1],
        value[2].replace(/^["']|["']$/g, ''),
      ]),
    );
    return { id: match[1], ...values };
  });
}

function readFixture(fileName) {
  const filePath = path.join(detectionsDir, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`No existe el fixture ${fileName}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateRule(rule) {
  assert(rule.experiment, `${rule.id}: falta experiment`);
  assert(rule.signal, `${rule.id}: falta signal`);
  assert(rule.positive_case, `${rule.id}: falta positive_case`);
  assert(rule.negative_case, `${rule.id}: falta negative_case`);
  const positive = readFixture(rule.positive_case);
  const negative = readFixture(rule.negative_case);

  assert(
    positive.expected_match === true,
    `${rule.id}: el caso positivo debe tener expected_match=true`,
  );
  assert(
    negative.expected_match === false,
    `${rule.id}: el caso negativo debe tener expected_match=false`,
  );
  assert(
    positive.execution_id && negative.execution_id,
    `${rule.id}: ambos fixtures deben tener execution_id`,
  );
}

try {
  const rules = readRules();
  assert(rules.length === 4, `Se esperaban 4 reglas y se encontraron ${rules.length}`);
  rules.forEach(validateRule);
  console.log(`Detecciones válidas: ${rules.length} reglas y ${rules.length * 2} fixtures`);
} catch (error) {
  console.error(`Validación fallida: ${error.message}`);
  process.exitCode = 1;
}
