/** 18 cascade effects per CLAUDE.md §7 */

export interface CascadeEffect {
    ordem: '1' | '2' | '3';
    canal: string;
    mag: string;
    hor: string;
    evidenceUrl?: string;
}

export const CASCADE: CascadeEffect[] = [
    // 1.ª ORDEM
    { ordem: '1', canal: 'Preço bomba (diesel)', mag: '+30-50 cênt/l', hor: 'Sem 1-4' },
    { ordem: '1', canal: 'Custo bens essenciais', mag: '+2-4%', hor: 'Sem 2-4' },
    { ordem: '1', canal: 'OE: mecanismo IVA', mag: '~31 M€ (4 sem)', hor: 'Sem 1-4', evidenceUrl: 'https://www.erse.pt/media/x4wngp3t/relatorio_precos_combustiveis.pdf' },
    { ordem: '1', canal: 'Famílias', mag: '~70 €/mês', hor: 'Sem 1-4' },
    { ordem: '1', canal: 'PME transportes', mag: '-5 a -12 p.p. EBITDA', hor: 'Sem 1-4' },

    // 2.ª ORDEM
    { ordem: '2', canal: 'Pass-through inflac.', mag: '+0,1-0,2 p.p. core', hor: 'M 1-3' },
    { ordem: '2', canal: 'BCE / taxas juro', mag: 'Prob. hike 85%→95%+', hor: 'M 2-6' },
    { ordem: '2', canal: 'Turismo', mag: '-2 a -5% receitas', hor: 'M 2-6' },
    { ordem: '2', canal: 'Cadeia alimentar', mag: '+0,5-1,5 p.p.', hor: 'M 1-4', evidenceUrl: 'https://banco.pt/estudos/inflacao-cadeia-alimentar' },
    { ordem: '2', canal: 'Crédito habitação', mag: '+15-30 €/mês', hor: 'M 3-9' },
    { ordem: '2', canal: 'Indústria transf.', mag: 'Compressão margens', hor: 'M 1-4' },

    // 3.ª ORDEM
    { ordem: '3', canal: 'PIB real', mag: '1,5-2,0% (vs 2,3%)', hor: '2026', evidenceUrl: 'https://www.bportugal.pt/sites/default/files/anexos/pdf-boletim/be_dezembro2023_pt.pdf' },
    { ordem: '3', canal: 'Saldo orçamental', mag: 'Agravamento 0,2% PIB', hor: '2026' },
    { ordem: '3', canal: 'Insolvências', mag: '+10-15%', hor: '2026-27' },
    { ordem: '3', canal: 'Desemprego', mag: '+0,2 p.p.', hor: '2026-27' },
    { ordem: '3', canal: 'Investigação/Transição', mag: 'Atraso 1-2 anos', hor: '2026-28' },
    { ordem: '3', canal: 'Balança comercial', mag: 'Agravamento défice energia', hor: '2026' }
];
