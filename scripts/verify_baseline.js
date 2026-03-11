const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '../data/model_state_initial.json');
let state;

try {
    const stateData = fs.readFileSync(statePath, 'utf8');
    state = JSON.parse(stateData);
} catch (e) {
    console.error("FAILED to load data/model_state_initial.json");
    process.exit(1);
}

// Minimal port of S4 logic to protect peak expectations
function computeS4Peak(scenarioKey) {
    const multGas = state.mult_gas[scenarioKey];
    const multDie = state.mult_die[scenarioKey];

    const TAX_GAS = state.base_eff_gas - state.pretax_gas;
    const OTH_GAS = state.pretax_gas - state.ext_gas;
    const gasEff = TAX_GAS + OTH_GAS + state.ext_gas * multGas;

    const TAX_DIE = state.base_eff_die - state.pretax_die;
    const OTH_DIE = state.pretax_die - state.ext_die;
    const dieEff = TAX_DIE + OTH_DIE + state.ext_die * multDie;

    return { gasEff, dieEff };
}

// CLAUDE.md reference values for S4
const EXTREMO_EXPECTED_GAS = 2.125;
const EXTREMO_EXPECTED_DIE = 2.458;

const peakExtremo = computeS4Peak('extremo');

let fail = false;
// Using a 0.001 tolerance since javascript floats and initial specs might differ slightly
if (Math.abs(peakExtremo.gasEff - EXTREMO_EXPECTED_GAS) > 0.001) {
    console.error(`❌ Mismatch in EXTREMO S4 Gasolina: Expected ~${EXTREMO_EXPECTED_GAS}, got ${peakExtremo.gasEff.toFixed(4)}`);
    fail = true;
} else {
    console.log(`✅ Extremo S4 Gasolina verified (${peakExtremo.gasEff.toFixed(4)})`);
}

if (Math.abs(peakExtremo.dieEff - EXTREMO_EXPECTED_DIE) > 0.001) {
    console.error(`❌ Mismatch in EXTREMO S4 Gasóleo: Expected ~${EXTREMO_EXPECTED_DIE}, got ${peakExtremo.dieEff.toFixed(4)}`);
    fail = true;
} else {
    console.log(`✅ Extremo S4 Gasóleo verified (${peakExtremo.dieEff.toFixed(4)})`);
}

if (fail) {
    process.exit(1);
} else {
    console.log("✅ Baseline model protection (S4 peak costs) passed.");
}
