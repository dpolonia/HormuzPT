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
});
