import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PriceDashboard } from './PriceDashboard';
import { DEFAULT_CONTROLS, DEFAULT_MODEL_STATE } from '../../model/types';
import { compute } from '../../model/engine';

describe('PriceDashboard', () => {
    const realResults = compute(DEFAULT_MODEL_STATE, DEFAULT_CONTROLS);

    it('renders price projections correctly using engine output', () => {
        render(
            <PriceDashboard 
                controls={DEFAULT_CONTROLS} 
                modelState={DEFAULT_MODEL_STATE} 
                results={realResults} 
            />
        );
        
        // Just verify it doesn't crash and renders the data table headers
        expect(screen.getAllByText(/Semana/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Gasóleo/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Gasolina/i).length).toBeGreaterThan(0);
    });

    it('renders all 3 cascade groups with correct order indicators', () => {
        render(
            <PriceDashboard 
                controls={DEFAULT_CONTROLS} 
                modelState={DEFAULT_MODEL_STATE} 
                results={realResults} 
            />
        );
        
        expect(screen.getByText(/1.ª Ordem — Impacto directo/i)).toBeInTheDocument();
        expect(screen.getByText(/2.ª Ordem — Transmissão/i)).toBeInTheDocument();
        expect(screen.getByText(/3.ª Ordem — Efeitos estruturais/i)).toBeInTheDocument();
        // Check cascade summary count
        expect(screen.getAllByText(/efeitos/i).length).toBeGreaterThan(0);
    });
});
