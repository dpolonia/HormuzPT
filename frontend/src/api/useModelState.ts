/** Hook to fetch model state from API with fallback to defaults */

import { useState, useEffect } from 'react';
import { ModelState, DEFAULT_MODEL_STATE } from '../model/types';
import { apiGet } from './client';

interface ModelStateResponse {
    source: string;
    updated_at: string;
    state: ModelState;
}

export function useModelState() {
    const [state, setState] = useState<ModelState>(DEFAULT_MODEL_STATE);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState<string>('default');

    useEffect(() => {
        apiGet<ModelStateResponse>('/model-state')
            .then((res) => {
                if (res?.state && res.state.base_eff_gas !== undefined) {
                    setState(res.state);
                    setSource(res.source || 'api');
                } else {
                    // API returned 200 but no valid state — keep defaults
                    setSource('fallback');
                }
            })
            .catch(() => {
                // Fallback to defaults
                setSource('fallback');
            })
            .finally(() => setLoading(false));
    }, []);

    return { state, loading, source };
}
