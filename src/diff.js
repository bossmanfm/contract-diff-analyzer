const fs = require('fs').promises;
const Diff = require('diff');

// Parse Solidity file to extract functions, events, and storage
function parseSolidity(source) {
  const functions = [];
  const events = [];
  const storageVars = [];

  // Match function definitions
  const functionRegex = /function\s+(\w+)\s*\([^)]*\)/g;
  let match;
  while ((match = functionRegex.exec(source)) !== null) {
    functions.push(match[1]);
  }

  // Match event definitions
  const eventRegex = /event\s+(\w+)\s*\(/g;
  while ((match = eventRegex.exec(source)) !== null) {
    events.push(match[1]);
  }

  // Match storage variables
  const storageRegex = /(uint|int|address|bool|bytes|string|mapping)[\w\[\]]*\s+(\w+)\s*;/g;
  while ((match = storageRegex.exec(source)) !== null) {
    storageVars.push({
      type: match[1],
      name: match[2]
    });
  }

  return { functions, events, storageVars };
}

async function diffContracts(oldPath, newPath) {
  const oldSource = await fs.readFile(oldPath, 'utf8');
  const newSource = await fs.readFile(newPath, 'utf8');

  const oldParsed = parseSolidity(oldSource);
  const newParsed = parseSolidity(newSource);

  // Compare functions
  const oldFuncSet = new Set(oldParsed.functions);
  const newFuncSet = new Set(newParsed.functions);

  const added = newParsed.functions.filter(f => !oldFuncSet.has(f));
  const removed = oldParsed.functions.filter(f => !newFuncSet.has(f));
  
  // Find modified functions (same name, different signature - simplified)
  const modified = [];
  for (const func of oldParsed.functions) {
    if (newFuncSet.has(func)) {
      const oldLine = oldSource.match(new RegExp(`function\\s+${func}\\s*\\([^)]*\\)`));
      const newLine = newSource.match(new RegExp(`function\\s+${func}\\s*\\([^)]*\\)`));
      if (oldLine && newLine && oldLine[0] !== newLine[0]) {
        modified.push({ name: func, old: oldLine[0], new: newLine[0] });
      }
    }
  }

  // Compare events
  const oldEventSet = new Set(oldParsed.events);
  const newEventSet = new Set(newParsed.events);

  const eventsAdded = newParsed.events.filter(e => !oldEventSet.has(e));
  const eventsRemoved = oldParsed.events.filter(e => !newEventSet.has(e));

  // Compare storage (simplified check)
  const storageChanges = [];
  const oldStorageMap = new Map(oldParsed.storageVars.map(v => [v.name, v.type]));
  const newStorageMap = new Map(newParsed.storageVars.map(v => [v.name, v.type]));

  for (const [name, newType] of newStorageMap) {
    const oldType = oldStorageMap.get(name);
    if (oldType && oldType !== newType) {
      storageChanges.push({ variable: name, oldType, newType });
    } else if (!oldType) {
      storageChanges.push({ variable: name, oldType: null, newType });
    }
  }

  // Full text diff
  const textDiff = Diff.createTwoFilesPatch(
    oldPath, newPath,
    oldSource, newSource,
    'Old Version', 'New Version'
  );

  return {
    functions: {
      added,
      removed,
      modified
    },
    events: {
      added: eventsAdded,
      removed: eventsRemoved
    },
    storageChanges,
    textDiff
  };
}

async function analyzeStorage(oldPath, newPath) {
  const oldSource = await fs.readFile(oldPath, 'utf8');
  const newSource = await fs.readFile(newPath, 'utf8');

  const oldParsed = parseSolidity(oldSource);
  const newParsed = parseSolidity(newSource);

  const changes = [];
  const oldStorageMap = new Map(oldParsed.storageVars.map((v, i) => [v.name, { ...v, slot: i }]));
  const newStorageMap = new Map(newParsed.storageVars.map((v, i) => [v.name, { ...v, slot: i }]));

  for (const [name, newVar] of newStorageMap) {
    const oldVar = oldStorageMap.get(name);
    if (oldVar && oldVar.type !== newVar.type) {
      changes.push({
        variable: name,
        slot: newVar.slot,
        oldType: oldVar.type,
        newType: newVar.type
      });
    } else if (!oldVar) {
      changes.push({
        variable: name,
        slot: newVar.slot,
        oldType: null,
        newType: newVar.type
      });
    }
  }

  return changes;
}

module.exports = { diffContracts, analyzeStorage, parseSolidity };
