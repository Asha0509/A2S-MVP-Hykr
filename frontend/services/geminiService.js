/**
 * GeminiService - Connects the AI Consultant frontend to the backend pipeline.
 * 
 * Flow: Frontend → Spring Boot (port 8080, proxied by Vite) → Python Flask LLM (port 5001)
 *
 * The Vite dev server proxies /api/* to http://localhost:8080.
 * The Spring Boot backend proxies /api/chat/* to http://localhost:5001.
 */

class GeminiService {

    isAvailable() {
        return true;
    }

    async getDesignAdvice(userQuery, context) {
        try {
            const response = await fetch('/api/chat/consultant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userQuery, context })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return this._normalizeResponse(data);
        } catch (error) {
            console.error('Error fetching design advice:', error);
            throw error;
        }
    }

    async performVastuAudit(roomType, layoutDescription) {
        try {
            const formData = new FormData();
            formData.append('roomType', roomType);
            formData.append('description', layoutDescription);

            const response = await fetch('/api/chat/vastu', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return this._normalizeVastuAudit(data);
        } catch (error) {
            console.error('Error performing Vastu audit:', error);
            throw error;
        }
    }

    /**
     * Normalize the response from the Python LLM service to ensure
     * the frontend always receives a consistent structure.
     */
    _normalizeResponse(data) {
        return {
            response_text: data.response_text || data.text || 'No response received.',
            products: Array.isArray(data.products) ? data.products : null,
            vastu: data.vastu || null,
            filters: data.filters || {},
            error: data.error || null,
        };
    }

    _normalizeVastuAudit(data) {
        const scoreValue = Number.isFinite(Number(data?.score))
            ? Math.max(0, Math.min(100, Number(data.score)))
            : Number.isFinite(Number(data?.vastu_score))
                ? Math.max(0, Math.min(100, Number(data.vastu_score)))
                : 0;

        const pros = Array.isArray(data?.pros)
            ? data.pros
            : Array.isArray(data?.vastu_pros)
                ? data.vastu_pros
                : [];

        const cons = Array.isArray(data?.cons)
            ? data.cons
            : Array.isArray(data?.vastu_cons)
                ? data.vastu_cons
                : [];

        const summary = data?.summary || data?.vastu_summary || 'Audit complete. View details.';

        return {
            ...data,
            score: scoreValue,
            summary,
            pros,
            cons,
            // Backward-compatible fields used by older widgets.
            vastu_score: scoreValue,
            vastu_summary: summary,
            vastu_pros: pros.map((item) => (typeof item === 'string' ? item : item?.text || '')),
            vastu_cons: cons.map((item) => (typeof item === 'string' ? item : item?.text || '')),
        };
    }
}

export const geminiService = new GeminiService();
