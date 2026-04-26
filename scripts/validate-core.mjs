import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

const ROOT = process.cwd();
const JS_FILES = [];
const SKIP_DIRS = new Set(['node_modules', '.git']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && full.endsWith('.js')) {
      JS_FILES.push(full);
    }
  }
}

function checkSyntax() {
  if (typeof vm.SourceTextModule !== 'function') {
    console.log('WARN: JavaScript syntax parsing unavailable in this Node runtime; skipping parser-based syntax checks.');
    return [];
  }

  const errors = [];
  for (const file of JS_FILES) {
    const text = fs.readFileSync(file, 'utf8');
    try {
      new vm.SourceTextModule(text, {
        identifier: pathToFileURL(file).href,
      });
    } catch (err) {
      errors.push({
        file: path.relative(ROOT, file),
        stderr: String(err?.message || err || '').trim(),
      });
    }
  }
  return errors;
}

function collectImportSpecs(text) {
  const specs = [];

  const importFromRe = /import\s+[\s\S]*?from\s*['"]([^'"]+)['"]/g;
  let match = null;
  while ((match = importFromRe.exec(text))) {
    specs.push(match[1]);
  }

  const dynamicImportRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRe.exec(text))) {
    specs.push(match[1]);
  }

  return specs;
}

function checkImportPaths() {
  const issues = [];
  for (const file of JS_FILES) {
    const text = fs.readFileSync(file, 'utf8');
    const specs = collectImportSpecs(text);
    for (const spec of specs) {
      if (!spec.startsWith('.')) continue;
      let resolved = path.resolve(path.dirname(file), spec);
      if (!path.extname(resolved)) resolved += '.js';
      if (!fs.existsSync(resolved)) {
        issues.push(`${path.relative(ROOT, file)} -> ${spec}`);
      }
    }
  }
  return issues;
}

function expect(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function checkNetworkMath() {
  const ipUtils = await import(pathToFileURL(path.join(ROOT, 'utils', 'ipUtils.js')).href);
  const networkMath = await import(pathToFileURL(path.join(ROOT, 'utils', 'networkMath.js')).href);

  const failures = [];

  expect(ipUtils.isValidIP('192.168.1.1') === true, 'isValidIP true case failed', failures);
  expect(ipUtils.isValidIP('256.1.1.1') === false, 'isValidIP false case failed', failures);
  expect(ipUtils.cidrToMask(24) === '255.255.255.0', 'cidrToMask(/24) failed', failures);
  expect(ipUtils.maskToCIDR('255.255.255.0') === 24, 'maskToCIDR(255.255.255.0) failed', failures);
  expect(ipUtils.getNetworkAddress('192.168.1.130', 25) === '192.168.1.128', 'getNetworkAddress failed', failures);
  expect(ipUtils.getBroadcastAddress('192.168.1.130', 25) === '192.168.1.255', 'getBroadcastAddress failed', failures);
  expect(ipUtils.getHostCount(24) === 254, 'getHostCount(/24) failed', failures);
  expect(ipUtils.isSameSubnet('192.168.1.10', '192.168.1.200', 24) === true, 'isSameSubnet true failed', failures);
  expect(ipUtils.isSameSubnet('192.168.1.10', '192.168.2.10', 24) === false, 'isSameSubnet false failed', failures);

  const subnet = networkMath.calculateSubnet('192.168.1.130', 25);
  expect(subnet.networkAddress === '192.168.1.128', 'calculateSubnet network failed', failures);
  expect(subnet.broadcastAddress === '192.168.1.255', 'calculateSubnet broadcast failed', failures);

  const lpm = networkMath.longestPrefixMatch('10.0.1.5', [
    { network: '0.0.0.0', prefix: 0, nextHop: '1.1.1.1' },
    { network: '10.0.0.0', prefix: 16, nextHop: '2.2.2.2' },
    { network: '10.0.1.0', prefix: 24, nextHop: '3.3.3.3' },
  ]);
  expect(Boolean(lpm) && lpm.nextHop === '3.3.3.3', 'longestPrefixMatch failed', failures);

  const split = networkMath.divideSubnet('192.168.1.0', 24, 26);
  expect(Array.isArray(split) && split.length === 4, 'divideSubnet count failed', failures);
  expect(split[0]?.networkAddress === '192.168.1.0', 'divideSubnet first network failed', failures);
  expect(split[3]?.networkAddress === '192.168.1.192', 'divideSubnet last network failed', failures);

  const vlsm = networkMath.vlsmAllocate('10.0.0.0', 24, [
    { name: 'A', hosts: 50 },
    { name: 'B', hosts: 20 },
    { name: 'C', hosts: 10 },
  ]);
  expect(Array.isArray(vlsm) && vlsm.length === 3, 'vlsmAllocate count failed', failures);
  expect(vlsm[0]?.hostsNeeded === 50, 'vlsmAllocate ordering failed', failures);

  const summary = networkMath.summarizeRoutes([
    { network: '10.0.0.0', prefix: 24 },
    { network: '10.0.1.0', prefix: 24 },
  ]);
  expect(summary?.network === '10.0.0.0' && summary?.prefix === 23, 'summarizeRoutes failed', failures);

  return failures;
}

async function checkCurriculumArchitecture() {
  const registry = await import(pathToFileURL(path.join(ROOT, 'data', 'pathRegistry.js')).href);
  const simulations = await import(pathToFileURL(path.join(ROOT, 'data', 'curriculum', 'simulationCatalog.js')).href);

  const failures = [];
  const paths = registry.ALL_PATHS || [];
  const simulationCatalog = simulations.SIMULATION_CATALOG || {};
  const catalogIds = new Set(Object.keys(simulationCatalog));

  expect(paths.length === 6, `expected 6 CCNA domains, found ${paths.length}`, failures);

  const totalTopics = paths.reduce((sum, pathDef) => sum + (pathDef.topicCount || pathDef.modules?.length || 0), 0);
  expect(totalTopics === 78, `expected 78 CCNA topics, found ${totalTopics}`, failures);

  const examWeightTotal = paths.reduce((sum, pathDef) => sum + (pathDef.examWeight || 0), 0);
  expect(examWeightTotal === 100, `expected exam weight total 100, found ${examWeightTotal}`, failures);

  const expectedFinalCounts = {
    fundamentals: 30,
    'network-access': 35,
    'ip-connectivity': 40,
    'ip-services': 25,
    'security-fundamentals': 30,
    'automation-programmability': 25,
  };

  for (const pathDef of paths) {
    expect(Array.isArray(pathDef.modules) && pathDef.modules.length > 0, `${pathDef.id} missing modules/topics`, failures);
    expect(Array.isArray(pathDef.topicGroups) && pathDef.topicGroups.length > 0, `${pathDef.id} missing topic groups`, failures);
    expect(pathDef.finalExam?.questionCount === expectedFinalCounts[pathDef.id], `${pathDef.id} final exam question count mismatch`, failures);
    expect(pathDef.finalExam?.passingScore === 80, `${pathDef.id} final exam pass score should be 80`, failures);

    for (const moduleDef of pathDef.modules || []) {
      expect(typeof moduleDef.code === 'string' && moduleDef.code.length > 0, `${pathDef.id}/${moduleDef.id} missing topic code`, failures);
      expect(Array.isArray(moduleDef.theoryOutline) && moduleDef.theoryOutline.length > 0, `${pathDef.id}/${moduleDef.id} missing theory outline`, failures);
      expect(Array.isArray(moduleDef.sourceRefs) && moduleDef.sourceRefs.length > 0, `${pathDef.id}/${moduleDef.id} missing source refs`, failures);
      expect(Array.isArray(moduleDef.sourceManifest) && moduleDef.sourceManifest.length > 0, `${pathDef.id}/${moduleDef.id} missing source manifest`, failures);
      expect(moduleDef.quizPassingScore === 70, `${pathDef.id}/${moduleDef.id} quiz pass score should be 70`, failures);
      expect(catalogIds.has(moduleDef.simulationType), `${pathDef.id}/${moduleDef.id} uses unknown simulation type "${moduleDef.simulationType}"`, failures);
    }
  }

  const simulationsList = registry.getAllSimulations();
  expect(simulationsList.length === 78, `expected 78 simulations, found ${simulationsList.length}`, failures);

  return failures;
}

async function main() {
  walk(ROOT);

  const syntaxErrors = checkSyntax();
  const importIssues = checkImportPaths();
  const mathFailures = await checkNetworkMath();
  const curriculumFailures = await checkCurriculumArchitecture();

  if (syntaxErrors.length === 0) {
    console.log('OK: JavaScript syntax');
  } else {
    console.log('FAIL: JavaScript syntax');
    for (const err of syntaxErrors) {
      console.log(`  - ${err.file}`);
      if (err.stderr) console.log(`    ${err.stderr.split('\n')[0]}`);
    }
  }

  if (importIssues.length === 0) {
    console.log('OK: Relative import targets');
  } else {
    console.log('FAIL: Relative import targets');
    for (const issue of importIssues) {
      console.log(`  - ${issue}`);
    }
  }

  if (mathFailures.length === 0) {
    console.log('OK: Networking math invariants');
  } else {
    console.log('FAIL: Networking math invariants');
    for (const failure of mathFailures) {
      console.log(`  - ${failure}`);
    }
  }

  if (curriculumFailures.length === 0) {
    console.log('OK: Curriculum architecture invariants');
  } else {
    console.log('FAIL: Curriculum architecture invariants');
    for (const failure of curriculumFailures) {
      console.log(`  - ${failure}`);
    }
  }

  const failed = syntaxErrors.length > 0 || importIssues.length > 0 || mathFailures.length > 0 || curriculumFailures.length > 0;
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('Validation runner failed:', err);
  process.exit(1);
});
