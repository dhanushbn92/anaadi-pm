/**
 * Anaadi PM sync backend.
 *
 * Paste this into the Apps Script editor of the Google Sheet that should hold the
 * data (Extensions > Apps Script), run setup() once, then deploy as a web app.
 * The board page reads and writes through the web app URL.
 */

var SHEET_NAME = 'data';
var HEADERS = ['id', 'type', 'summary', 'json', 'updatedAt'];
var TYPES = { project: true, task: true, comment: true };
var OPS = { upsert: true, patch: true, 'delete': true };
var MAX_RECORDS = 5000;
var MAX_JSON_CHARS = 20000;
var MAX_OPS = 200;
var ID_PATTERN = /^[A-Za-z0-9_\-]{1,64}$/;
var BLOCKED_KEYS = { '__proto__': true, 'constructor': true, 'prototype': true };

// Run once from the editor: creates the "data" tab and asks for permission.
function setup() {
  getSheet_();
  currentVersion_();
  Logger.log('Ready. Next: Deploy > New deployment > Web app.');
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    if (params.action !== 'list') return json_({ ok: true, service: 'anaadi-pm' });

    var version = currentVersion_();
    if (params.v !== undefined && String(params.v) === String(version)) {
      return json_({ ok: true, unchanged: true, version: version });
    }
    return json_({ ok: true, version: version, records: readRecords_() });
  } catch (err) {
    return json_({ ok: false, error: messageOf_(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    validateOps_(body.ops);

    try {
      lock.waitLock(20000);
      locked = true;
    } catch (busy) {
      return json_({ ok: false, retry: true, error: 'The board is busy, trying again.' });
    }

    var records = applyOps_(body.ops);
    var version = bumpVersion_();
    return json_({ ok: true, version: version, records: records });
  } catch (err) {
    return json_({ ok: false, error: messageOf_(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function validateOps_(ops) {
  if (!Array.isArray(ops)) throw new Error('ops must be a list');
  if (ops.length > MAX_OPS) throw new Error('Too many changes in one request');
  ops.forEach(function (op) {
    if (!op || typeof op !== 'object') throw new Error('Bad change');
    if (!OPS[op.op]) throw new Error('Unknown change type');
    if (typeof op.id !== 'string' || !ID_PATTERN.test(op.id)) throw new Error('Bad id');
    if (op.op === 'upsert' && !TYPES[op.type]) throw new Error('Unknown record type');
    if (op.op !== 'delete') {
      if (!op.data || typeof op.data !== 'object' || Array.isArray(op.data)) throw new Error('Bad data');
      delete op.data.id;
    }
  });
}

function applyOps_(ops) {
  var records = readRecords_();
  var byId = {};
  records.forEach(function (r) { byId[r.id] = r; });
  var now = new Date().toISOString();

  ops.forEach(function (op) {
    var existing = byId[op.id];
    if (op.op === 'upsert') {
      var data = cleanData_(op.data);
      if (existing) {
        existing.type = op.type;
        existing.data = data;
        existing.updatedAt = now;
      } else {
        var rec = { id: op.id, type: op.type, data: data, updatedAt: now };
        records.push(rec);
        byId[op.id] = rec;
      }
    } else if (op.op === 'patch') {
      if (existing) {
        var patch = cleanData_(op.data);
        Object.keys(patch).forEach(function (k) { existing.data[k] = patch[k]; });
        existing.updatedAt = now;
      }
    } else if (existing) {
      delete byId[op.id];
    }
  });

  records = records.filter(function (r) { return byId[r.id] === r; });
  if (records.length > MAX_RECORDS) throw new Error('The board is full');
  records.forEach(function (r) {
    if (JSON.stringify(r.data).length > MAX_JSON_CHARS) throw new Error('That item is too large');
  });

  writeRecords_(records);
  return records;
}

function cleanData_(data) {
  var out = {};
  Object.keys(data).forEach(function (k) {
    if (!BLOCKED_KEYS[k]) out[k] = data[k];
  });
  return out;
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), HEADERS.length).setNumberFormat('@');
  }
  return sh;
}

function readRecords_() {
  var sh = getSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var id = String(values[i][0]);
    if (!id) continue;
    var data;
    try {
      data = JSON.parse(String(values[i][3]));
    } catch (err) {
      continue;
    }
    out.push({ id: id, type: String(values[i][1]), data: data, updatedAt: String(values[i][4]) });
  }
  return out;
}

function writeRecords_(records) {
  var sh = getSheet_();
  var needed = records.length + 1;
  if (sh.getMaxRows() < needed) sh.insertRowsAfter(sh.getMaxRows(), needed - sh.getMaxRows());
  var maxRows = sh.getMaxRows();
  if (maxRows > 1) sh.getRange(2, 1, maxRows - 1, HEADERS.length).clearContent();
  if (!records.length) return;
  var rows = records.map(function (r) {
    return [r.id, r.type, summaryOf_(r.data), JSON.stringify(r.data), r.updatedAt];
  });
  sh.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
}

// Human-readable label for the Sheet; leading characters that Sheets treats as formulas are defused.
function summaryOf_(data) {
  var s = String(data.name || data.title || data.body || '').replace(/\s+/g, ' ').slice(0, 80);
  if (/^[=+\-@]/.test(s)) s = ' ' + s;
  return s;
}

function currentVersion_() {
  return Number(PropertiesService.getScriptProperties().getProperty('v') || 0);
}

function bumpVersion_() {
  var v = currentVersion_() + 1;
  PropertiesService.getScriptProperties().setProperty('v', String(v));
  return v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function messageOf_(err) {
  return String((err && err.message) || err);
}
