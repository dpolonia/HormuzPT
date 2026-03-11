import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HistoryPage } from './HistoryPage';
import * as client from '../../api/client';

// Mock the API client
vi.mock('../../api/client', () => ({
    apiGet: vi.fn(),
}));

describe('HistoryPage', () => {
    it('renders loading state initially', () => {
        vi.mocked(client.apiGet).mockReturnValue(new Promise(() => {}));
        render(<HistoryPage />);
        expect(screen.getByText('A carregar histórico...')).toBeInTheDocument();
    });

    it('renders empty state when no events exist', async () => {
        vi.mocked(client.apiGet).mockResolvedValue({ events: [] });
        render(<HistoryPage />);
        
        await waitFor(() => {
            expect(screen.getByText('Sem entradas no histórico de alterações.')).toBeInTheDocument();
        });
    });

    it('renders history entries successfully', async () => {
        const mockEvents = [
            { id: 1, timestamp: '2026-03-11T12:00:00Z', user: 'system', action: 'Recalibration', details: 'Updated limits' },
            { id: 2, timestamp: '2026-03-11T13:00:00Z', user: 'admin', action: 'Scenario Switch', details: 'Severo selected' }
        ];
        vi.mocked(client.apiGet).mockResolvedValue({ events: mockEvents });
        render(<HistoryPage />);
        
        await waitFor(() => {
            expect(screen.getByText(/#1 Recalibration/)).toBeInTheDocument();
            expect(screen.getByText(/#2 Scenario Switch/)).toBeInTheDocument();
            expect(screen.getByText(/Updated limits/)).toBeInTheDocument();
            expect(screen.getByText(/Severo selected/)).toBeInTheDocument();
        });
    });
});
