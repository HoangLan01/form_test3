const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const COUNTER_FILE = path.join(DATA_DIR, 'counter.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory queue to ensure concurrency safety (Atomic counter)
let lockPromise = Promise.resolve();

/**
 * Load counter state from file or initialize
 */
function loadState() {
  const currentYear = new Date().getFullYear();
  if (fs.existsSync(COUNTER_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
      if (data.year === currentYear) {
        return data;
      }
      // Reset for new year
      return { year: currentYear, lastNumber: 0 };
    } catch (err) {
      console.error('Lỗi khi đọc file counter.json, khởi tạo lại:', err);
      return { year: currentYear, lastNumber: 0 };
    }
  }
  return { year: currentYear, lastNumber: 0 };
}

/**
 * Save counter state to file
 */
function saveState(state) {
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * Format code: SIPAS-TT-YYYY-XXXX
 * @param {number} num
 * @param {number} year
 * @returns {string} e.g. SIPAS-TT-2026-0001
 */
function formatCode(num, year = new Date().getFullYear()) {
  const padded = String(num).padStart(4, '0');
  return `SIPAS-TT-${year}-${padded}`;
}

/**
 * Get next code safely with concurrency lock
 * @returns {Promise<{ code: string, number: number, year: number }>}
 */
async function getNextCode() {
  return new Promise((resolve, reject) => {
    lockPromise = lockPromise.then(async () => {
      try {
        const state = loadState();
        state.lastNumber += 1;
        saveState(state);
        const code = formatCode(state.lastNumber, state.year);
        resolve({
          code,
          number: state.lastNumber,
          year: state.year
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Get current latest code without incrementing
 */
function getCurrentState() {
  const state = loadState();
  return {
    code: state.lastNumber > 0 ? formatCode(state.lastNumber, state.year) : null,
    number: state.lastNumber,
    year: state.year
  };
}

/**
 * Manually set or sync counter (e.g. from Google Sheet row count)
 */
function setCounter(number, year = new Date().getFullYear()) {
  const state = { year, lastNumber: Math.max(0, parseInt(number, 10) || 0) };
  saveState(state);
  return state;
}

module.exports = {
  getNextCode,
  getCurrentState,
  setCounter,
  formatCode
};
