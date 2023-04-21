const DEFAULTS = {
  jkToEsc: true,
}

// Saves options to chrome.storage
function saveOptions() {
  const elemValues = getElementValues();
  chrome.storage.sync.set(elemValues);
}

// Restores state using the preferences stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get(DEFAULTS, function(items) {
    setElementValues(items)
  });
}

function getElementValues() {
  return {
    jkToEsc: document.getElementById('jkToEsc').checked,
  };
}

function setElementValues(items) {
  document.getElementById('jkToEsc').checked = items.jkToEsc;
}

function setElementValuesToDefaults() {
  setElementValues(DEFAULTS);
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('restore').addEventListener('click',
  setElementValuesToDefaults);
