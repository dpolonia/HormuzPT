import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ControlPanel } from './ControlPanel';
import { DEFAULT_CONTROLS } from '../../model/types';

describe('ControlPanel', () => {
    it('renders scenario buttons and applies active class', () => {
        const onChangeMock = vi.fn();
        const { rerender } = render(<ControlPanel controls={DEFAULT_CONTROLS} onChange={onChangeMock} />);
        
        const moderadoBtn = screen.getByText('Moderado');
        const severoBtn = screen.getByText('Severo');
        
        // Default scenario is severo
        expect(severoBtn).toHaveClass('active');
        expect(moderadoBtn).not.toHaveClass('active');
        
        // Click moderado
        fireEvent.click(moderadoBtn);
        expect(onChangeMock).toHaveBeenCalledWith(expect.objectContaining({ scenario: 'moderado' }));
    });

    it('updates range sliders correctly', () => {
        const onChangeMock = vi.fn();
        render(<ControlPanel controls={DEFAULT_CONTROLS} onChange={onChangeMock} />);
        
        const sliders = screen.getAllByRole('slider');
        // Let's grab the first slider (elast_gas)
        const elastGasSlider = sliders[0];
        fireEvent.change(elastGasSlider, { target: { value: '-0.3' } });
        
        expect(onChangeMock).toHaveBeenCalledWith(expect.objectContaining({ elast_gas: -0.3 }));
    });
});
