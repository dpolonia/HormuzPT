/** 18 cascade effects per CLAUDE.md §7 */

import { CascadeEffect } from './types';

export const CASCADE: CascadeEffect[] = [
    // 1.ª ordem (verde) — Semanas 1-4
    { ordem: '1', canal: 'Fatura energética', mag: '+200-350 M€/mês', hor: 'Sem 1-4' },
    { ordem: '1', canal: 'Preços combustíveis', mag: 'Gasóleo 2,21 €/l', hor: 'Sem 1-4' },
    { ordem: '1', canal: 'IPC directo', mag: '+0,7-1,0 p.p.', hor: 'Sem 1-4' },
    { ordem: '1', canal: 'OE: mecanismo IVA', mag: '~31 M€ (4 sem)', hor: 'Sem 1-4' },
    { ordem: '1', canal: 'Famílias', mag: '~70 €/mês', hor: 'Sem 1-4' },
    { ordem: '1', canal: 'PME transportes', mag: '-5 a -12 p.p. EBITDA', hor: 'Sem 1-4' },
    // 2.ª ordem (amarelo) — Meses 1-6
    { ordem: '2', canal: 'Pass-through inflac.', mag: '+0,1-0,2 p.p. core', hor: 'M 1-3' },
    { ordem: '2', canal: 'BCE / taxas juro', mag: 'Prob. hike 85%→95%+', hor: 'M 2-6' },
    { ordem: '2', canal: 'Turismo', mag: '-2 a -5% receitas', hor: 'M 2-6' },
    { ordem: '2', canal: 'Cadeia alimentar', mag: '+0,5-1,5 p.p.', hor: 'M 1-4' },
    { ordem: '2', canal: 'Crédito habitação', mag: '+15-30 €/mês', hor: 'M 3-9' },
    { ordem: '2', canal: 'Indústria transf.', mag: 'Compressão margens', hor: 'M 1-4' },
    // 3.ª ordem (laranja) — Meses 3-18+
    { ordem: '3', canal: 'PIB real', mag: '1,5-2,0% (vs 2,3%)', hor: '2026' },
    { ordem: '3', canal: 'Saldo orçamental', mag: '-1,0 a -1,5% PIB', hor: '2026' },
    { ordem: '3', canal: 'Transição energética', mag: 'Reorientação PRR', hor: '27-30' },
    { ordem: '3', canal: 'Reestruct. sectorial', mag: '-3 a -5% PME transp.', hor: 'M 6-18' },
    { ordem: '3', canal: 'Negociação salarial', mag: '+0,5-1,0% desp. AP', hor: '2027' },
    { ordem: '3', canal: 'Defesa/segurança', mag: 'Não quantificável', hor: '27-28' },
];
