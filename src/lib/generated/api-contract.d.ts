// Generated from contracts/openapi.json. Do not edit.
export interface paths {
    "/api/ai-chat/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["AiCapabilitiesDto"];
                        "text/json": components["schemas"]["AiCapabilitiesDto"];
                        "text/plain": components["schemas"]["AiCapabilitiesDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai-chat/query": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["AiChatQueryDto"];
                    "application/json": components["schemas"]["AiChatQueryDto"];
                    "text/json": components["schemas"]["AiChatQueryDto"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai-chat/stream": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["AiChatQueryDto"];
                    "application/json": components["schemas"]["AiChatQueryDto"];
                    "text/json": components["schemas"]["AiChatQueryDto"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/alert-settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    userId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PriceAlertSettingsDto"];
                        "text/json": components["schemas"]["PriceAlertSettingsDto"];
                        "text/plain": components["schemas"]["PriceAlertSettingsDto"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: {
                    userId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["UpdatePriceAlertSettingsDto"];
                    "application/json": components["schemas"]["UpdatePriceAlertSettingsDto"];
                    "text/json": components["schemas"]["UpdatePriceAlertSettingsDto"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PriceAlertSettingsDto"];
                        "text/json": components["schemas"]["PriceAlertSettingsDto"];
                        "text/plain": components["schemas"]["PriceAlertSettingsDto"];
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Alerts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeArchived?: boolean;
                    take?: number;
                    unreadOnly?: boolean;
                    userId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: {
                    userId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Alerts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: {
                    userId?: string;
                };
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Alerts/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Alerts/deduplicate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    apply?: boolean;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Alerts/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    userId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Alerts/unread-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    userId?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Analysis": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Analysis/analyze": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Analysis/bitcoin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/archetypes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    page?: number;
                    pageSize?: number;
                    sortBy?: string;
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/archetypes/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/archetypes/{id}/occurrences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    page?: number;
                    pageSize?: number;
                };
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/archetypes/match": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/archetypes/match-multi": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/archetypes/rankings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    horizon?: string;
                    sortBy?: string;
                    symbol?: string;
                    timeframe?: string;
                    top?: number;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Backtest/classify-records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    apply?: boolean;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Backtest/runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                    symbol?: string;
                    take?: number;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Backtest/runs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                };
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Confluence/calculate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Confluence/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Confluence/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/discovery/clear": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/discovery/evaluate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    limit?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/discovery/index-volume": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/discovery/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/discovery/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    candidateBudget?: number;
                    futureBars?: number;
                    labelDeadZonePct?: number;
                    lookbackBars?: number;
                    minAvgReturnPct?: number;
                    minSamples?: number;
                    minWinRate?: number;
                    roundTripCostBps?: number;
                    saveToDb?: boolean;
                    selectionFraction?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/discovery/volume-stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    take?: number;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ensemble-backtest/optimize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ensemble-backtest/run": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["EnsembleBacktestRunRequestDto"];
                    "application/json": components["schemas"]["EnsembleBacktestRunRequestDto"];
                    "text/json": components["schemas"]["EnsembleBacktestRunRequestDto"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Ensemble/batch-replay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    enableAtrRrEngine?: boolean;
                    enableKellySizing?: boolean;
                    enableMlClassifier?: boolean;
                    enableMtfFilter?: boolean;
                    enableSmcFilter?: boolean;
                    enableVolumeFilter?: boolean;
                    minConfidence?: number;
                    sampleCount?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Ensemble/evaluate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Ensemble/evaluations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Ensemble/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                    limit?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Ensemble/predict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/account": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BinanceAccountBalanceResult"];
                        "text/json": components["schemas"]["BinanceAccountBalanceResult"];
                        "text/plain": components["schemas"]["BinanceAccountBalanceResult"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/balance-snapshots": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    asset?: string;
                    limit?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/market-order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["BinanceOrderRequest"];
                    "application/json": components["schemas"]["BinanceOrderRequest"];
                    "text/json": components["schemas"]["BinanceOrderRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BinanceOrderResult"];
                        "text/json": components["schemas"]["BinanceOrderResult"];
                        "text/plain": components["schemas"]["BinanceOrderResult"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/orders/{symbol}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BinanceOrderResult"];
                        "text/json": components["schemas"]["BinanceOrderResult"];
                        "text/plain": components["schemas"]["BinanceOrderResult"];
                    };
                };
            };
        };
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/stop-loss": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["BinanceOrderRequest"];
                    "application/json": components["schemas"]["BinanceOrderRequest"];
                    "text/json": components["schemas"]["BinanceOrderRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BinanceOrderResult"];
                        "text/json": components["schemas"]["BinanceOrderResult"];
                        "text/plain": components["schemas"]["BinanceOrderResult"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/stream-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["StreamStatusDto"];
                        "text/json": components["schemas"]["StreamStatusDto"];
                        "text/plain": components["schemas"]["StreamStatusDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/stream/reconnect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Execution/take-profit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["BinanceOrderRequest"];
                    "application/json": components["schemas"]["BinanceOrderRequest"];
                    "text/json": components["schemas"]["BinanceOrderRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BinanceOrderResult"];
                        "text/json": components["schemas"]["BinanceOrderResult"];
                        "text/plain": components["schemas"]["BinanceOrderResult"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HealthResponse"];
                        "text/json": components["schemas"]["HealthResponse"];
                        "text/plain": components["schemas"]["HealthResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/freshness": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HealthResponse"];
                        "text/json": components["schemas"]["HealthResponse"];
                        "text/plain": components["schemas"]["HealthResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/live": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/workers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["WorkerHealthResponse"];
                        "text/json": components["schemas"]["WorkerHealthResponse"];
                        "text/plain": components["schemas"]["WorkerHealthResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/historical-analogs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    AsOfTimeMs?: number;
                    AtrMultiplier?: number;
                    LookbackBars?: number;
                    MinimumMeanSimilarity?: number;
                    NeighborCount?: number;
                    Page?: number;
                    PageSize?: number;
                    RoundTripCostPct?: number;
                    Symbol?: string;
                    Timeframe?: string;
                    WindowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["HistoricalAnalogResponse"];
                        "text/json": components["schemas"]["HistoricalAnalogResponse"];
                        "text/plain": components["schemas"]["HistoricalAnalogResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Indexer/ml-dataset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Indexer/rebuild-derived": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    confirm?: string;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Indexer/technical-indicators": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/liquidation/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/liquidation/latest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/btc/klines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    endTimeMs?: number;
                    interval?: string;
                    limit?: number;
                    startTimeMs?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KlineDto"][];
                        "text/json": components["schemas"]["KlineDto"][];
                        "text/plain": components["schemas"]["KlineDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/market/btc/tech-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    interval?: string;
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/candle-patterns": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    category?: string;
                    fromMs?: number;
                    page?: number;
                    pageSize?: number;
                    patternType?: string;
                    symbol?: string;
                    timeframe?: string;
                    toMs?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/candle-patterns/index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/candles/around": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    afterBars?: number;
                    beforeBars?: number;
                    symbol?: string;
                    timeframe?: string;
                    timeMs?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CandlesAroundResponse"];
                        "text/json": components["schemas"]["CandlesAroundResponse"];
                        "text/plain": components["schemas"]["CandlesAroundResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/data-audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeInventory?: boolean;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["DataAuditResponse"];
                        "text/json": components["schemas"]["DataAuditResponse"];
                        "text/plain": components["schemas"]["DataAuditResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/data-gaps/{id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/depth": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["OrderBookDepthDto"];
                        "text/json": components["schemas"]["OrderBookDepthDto"];
                        "text/plain": components["schemas"]["OrderBookDepthDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/klines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    endTimeMs?: number;
                    interval?: string;
                    limit?: number;
                    startTimeMs?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KlineDto"][];
                        "text/json": components["schemas"]["KlineDto"][];
                        "text/plain": components["schemas"]["KlineDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/klines/backfill": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    endDateUtc?: string;
                    fillGaps?: boolean;
                    reconcileExisting?: boolean;
                    requestsPerMinuteLimit?: number;
                    startDateUtc?: string;
                    symbol?: string;
                    timeframe?: string;
                    wait?: boolean;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["BackfillStartInfo"];
                        "text/json": components["schemas"]["BackfillStartInfo"];
                        "text/plain": components["schemas"]["BackfillStartInfo"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/market/market-structure": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    interval?: string;
                    limit?: number;
                    swingLookback?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/ml-dataset/build": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/pattern-index/rebuild": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    featureType?: string;
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/pattern-index/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    featureType?: string;
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/pattern-index/warmup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/pattern-search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["PatternSearchRequest"];
                    "application/json": components["schemas"]["PatternSearchRequest"];
                    "text/json": components["schemas"]["PatternSearchRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PatternSearchResponse"];
                        "text/json": components["schemas"]["PatternSearchResponse"];
                        "text/plain": components["schemas"]["PatternSearchResponse"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/market/sequence-scenarios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    interval?: string;
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/market/tech-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    interval?: string;
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/tickers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MarketTickerDto"][];
                        "text/json": components["schemas"]["MarketTickerDto"][];
                        "text/plain": components["schemas"]["MarketTickerDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/trades": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MarketTradeDto"][];
                        "text/json": components["schemas"]["MarketTradeDto"][];
                        "text/plain": components["schemas"]["MarketTradeDto"][];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/market/validate-candles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    interval?: string;
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/window-dataset": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    horizon?: string;
                    label?: number;
                    page?: number;
                    symbol?: string;
                    take?: number;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Market/window-dataset/build": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    horizon?: string;
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MetaResponse"];
                        "text/json": components["schemas"]["MetaResponse"];
                        "text/plain": components["schemas"]["MetaResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/News": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    page?: number;
                    pageSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    take?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PaperObservationListResponse"];
                        "text/json": components["schemas"]["PaperObservationListResponse"];
                        "text/plain": components["schemas"]["PaperObservationListResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-trades": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    fromDate?: string;
                    page?: number;
                    pageSize?: number;
                    side?: string;
                    status?: string;
                    symbol?: string;
                    symbols?: string;
                    take?: number;
                    timeframe?: string;
                    toDate?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-trades/equity-curve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-trades/evaluate-ensemble": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["EvaluateEnsembleRequest"];
                    "application/json": components["schemas"]["EvaluateEnsembleRequest"];
                    "text/json": components["schemas"]["EvaluateEnsembleRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-trades/observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    take?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["PaperObservationListResponse"];
                        "text/json": components["schemas"]["PaperObservationListResponse"];
                        "text/plain": components["schemas"]["PaperObservationListResponse"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-trades/open": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-trades/portfolio-summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    initialBalance?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/paper-trades/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Prediction/accuracy": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Prediction/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Prediction/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    includeLegacy?: boolean;
                    symbol?: string;
                    take?: number;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Prediction/latest": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    horizon?: string;
                    modelName?: string;
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Prediction/models": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/rag/news-context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    query?: string;
                    topK?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/regime/build": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/regime/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/regime/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/regime/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/research/capabilities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TechnicalCapabilitiesResponse"];
                        "text/json": components["schemas"]["TechnicalCapabilitiesResponse"];
                        "text/plain": components["schemas"]["TechnicalCapabilitiesResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/research/evidence": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ResearchEvidenceCatalogResponse"];
                        "text/json": components["schemas"]["ResearchEvidenceCatalogResponse"];
                        "text/plain": components["schemas"]["ResearchEvidenceCatalogResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/research/evidence/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ResearchEvidenceDetailDto"];
                        "text/json": components["schemas"]["ResearchEvidenceDetailDto"];
                        "text/plain": components["schemas"]["ResearchEvidenceDetailDto"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/research/specification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ResearchSpecificationDto"];
                        "text/json": components["schemas"]["ResearchSpecificationDto"];
                        "text/plain": components["schemas"]["ResearchSpecificationDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Sentiment/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Sentiment/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    limit?: number;
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Sentiment/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    symbol?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/smart-money/detect": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/smart-money/structures": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/telegram/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/telegram/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Transitions/build": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Transitions/entropy-ranking": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                    top?: number;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EntropyRankingResponse"];
                        "text/json": components["schemas"]["EntropyRankingResponse"];
                        "text/plain": components["schemas"]["EntropyRankingResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Transitions/from/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    top?: number;
                };
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ArchetypeTransitionsResponse"];
                        "text/json": components["schemas"]["ArchetypeTransitionsResponse"];
                        "text/plain": components["schemas"]["ArchetypeTransitionsResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Transitions/matrix": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TransitionMatrixDto"];
                        "text/json": components["schemas"]["TransitionMatrixDto"];
                        "text/plain": components["schemas"]["TransitionMatrixDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Transitions/predict": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TransitionPredictionDto"];
                        "text/json": components["schemas"]["TransitionPredictionDto"];
                        "text/plain": components["schemas"]["TransitionPredictionDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Transitions/predict-sequence": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    symbol?: string;
                    timeframe?: string;
                    windowSize?: number;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["SequencePredictionDto"];
                        "text/json": components["schemas"]["SequencePredictionDto"];
                        "text/plain": components["schemas"]["SequencePredictionDto"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Transitions/to/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    top?: number;
                };
                header?: never;
                path: {
                    id: number;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ArchetypeTransitionsResponse"];
                        "text/json": components["schemas"]["ArchetypeTransitionsResponse"];
                        "text/plain": components["schemas"]["ArchetypeTransitionsResponse"];
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/volume-profile/calculate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/volume-profile/current": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    lookbackBars?: number;
                    symbol?: string;
                    timeframe?: string;
                };
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AiCapabilitiesDto: {
            fallbackExplanation?: boolean;
            llmExplanation?: boolean;
            mlInference?: boolean;
            provider?: string | null;
            reason?: string | null;
        };
        AiChatQueryDto: {
            prompt?: string | null;
            symbol?: string | null;
            timeframe?: string | null;
        };
        ApiErrorEnvelope: {
            code?: string | null;
            message?: string | null;
            requestId?: string | null;
            retryable?: boolean;
        };
        ArchetypeOccurrenceOhlcDto: {
            /** Format: double */
            close?: number;
            /** Format: double */
            high?: number;
            /** Format: double */
            low?: number;
            /** Format: double */
            open?: number;
            /** Format: int64 */
            openTimeMs?: number;
            /** Format: double */
            volume?: number;
        };
        ArchetypeTransitionDto: {
            /** Format: double */
            avgBarsToTransition?: number;
            /** Format: double */
            avgReturnPct?: number;
            fromArchetypeCode?: string | null;
            /** Format: int64 */
            fromArchetypeId?: number;
            /** Format: int64 */
            id?: number;
            /** Format: int64 */
            lastSeenMs?: number;
            toArchetypeCode?: string | null;
            /** Format: int64 */
            toArchetypeId?: number;
            /** Format: int32 */
            transitionCount?: number;
            /** Format: double */
            transitionProbability?: number;
        };
        ArchetypeTransitionsResponse: {
            /** Format: int64 */
            archetypeId?: number;
            transitions?: components["schemas"]["ArchetypeTransitionDto"][] | null;
        };
        BackfillStartInfo: {
            /** Format: date-time */
            completedAtUtc?: string | null;
            /** Format: date-time */
            endDateUtc?: string;
            fillGaps?: boolean;
            reconcileExisting?: boolean;
            requestId?: string | null;
            /** Format: date-time */
            startDateUtc?: string;
            /** Format: date-time */
            startedAtUtc?: string;
            status?: string | null;
            symbol?: string | null;
            timeframes?: string[] | null;
        };
        BinanceAccountBalanceResult: {
            /** Format: double */
            availableBalance?: number;
            errorMessage?: string | null;
            rawResponseJson?: string | null;
            success?: boolean;
            /** Format: double */
            totalUnrealizedProfit?: number;
            /** Format: double */
            totalWalletBalance?: number;
            tradingMode?: string | null;
        };
        BinanceOrderRequest: {
            /** Format: double */
            price?: number | null;
            /** Format: double */
            quantity?: number;
            reduceOnly?: boolean | null;
            side?: string | null;
            /** Format: double */
            stopPrice?: number | null;
            symbol?: string | null;
            type?: string | null;
        };
        BinanceOrderResult: {
            /** Format: double */
            avgPrice?: number;
            clientOrderId?: string | null;
            errorMessage?: string | null;
            /** Format: double */
            executedQty?: number;
            /** Format: int64 */
            orderId?: number | null;
            rawResponseJson?: string | null;
            side?: string | null;
            status?: string | null;
            success?: boolean;
            symbol?: string | null;
            tradingMode?: string | null;
        };
        CandleGap: {
            /** Format: int32 */
            attemptCount?: number;
            /** Format: int64 */
            endOpenTimeMs?: number;
            /** Format: int64 */
            id?: number | null;
            /** Format: int64 */
            missingBars?: number;
            /** Format: date-time */
            nextRetryAtUtc?: string | null;
            reason?: string | null;
            /** Format: int64 */
            startOpenTimeMs?: number;
            status?: string | null;
        };
        CandlesAroundResponse: {
            candles?: components["schemas"]["KlineDto"][] | null;
            /** Format: int64 */
            requestedTimeMs?: number;
            requestId?: string | null;
            /** Format: int64 */
            resolvedTimeMs?: number | null;
            symbol?: string | null;
            timeframe?: string | null;
        };
        DataAuditResponse: {
            derivatives?: components["schemas"]["DerivativesAudit"];
            /** Format: date-time */
            generatedAtUtc?: string;
            news?: components["schemas"]["NewsAudit"];
            rulesAlerts?: components["schemas"]["RulesAlertsAudit"];
            symbol?: string | null;
            timeframes?: components["schemas"]["TimeframeAudit"][] | null;
        };
        DerivativeLineageQuality: {
            /** Format: int64 */
            asOfEligibleRows?: number;
            /** Format: int64 */
            completeRows?: number;
            /** Format: int64 */
            missingAvailableAt?: number;
            /** Format: int64 */
            missingMarketType?: number;
            /** Format: int64 */
            missingReceivedAt?: number;
            /** Format: int64 */
            missingSource?: number;
            /** Format: int64 */
            missingSourceEventTime?: number;
            /** Format: int64 */
            reconstructedRows?: number;
        };
        DerivativesAudit: {
            availabilityCaveat?: string | null;
            futuresMetrics?: components["schemas"]["FuturesMetricQuality"];
            marketMetrics?: components["schemas"]["MarketMetricQuality"][] | null;
        };
        DerivedTableAudit: {
            expectedOnePerFinalizedBar?: boolean;
            /** Format: int64 */
            latestAgeSeconds?: number | null;
            /** Format: int64 */
            latestSourceTimeMs?: number | null;
            /** Format: int64 */
            missingRows?: number | null;
            /** Format: int64 */
            rows?: number;
            table?: string | null;
        };
        EnsembleBacktestRunRequestDto: {
            customWeights?: {
                [key: string]: number | null;
            } | null;
            /** Format: int64 */
            endTimeMs?: number | null;
            /** Format: double */
            feeBps?: number | null;
            /** Format: double */
            initialCapital?: number | null;
            /** Format: double */
            minConfidence?: number | null;
            /** Format: int64 */
            startTimeMs?: number | null;
            symbol?: string | null;
            timeframe?: string | null;
        };
        EntropyRankingItemDto: {
            archetypeCode?: string | null;
            /** Format: int64 */
            archetypeId?: number;
            /** Format: double */
            entropyBits?: number;
            maturity?: string | null;
            /** Format: int32 */
            memberCount?: number;
            predictability?: string | null;
            /** Format: int32 */
            rank?: number;
            reason?: string | null;
            timeframe?: string | null;
            topTransitionCode?: string | null;
            /** Format: double */
            topTransitionProb?: number;
            validated?: boolean;
            /** Format: int32 */
            windowSize?: number;
        };
        EntropyRankingResponse: {
            items?: components["schemas"]["EntropyRankingItemDto"][] | null;
            maturity?: string | null;
            reason?: string | null;
            validated?: boolean;
        };
        EvaluateEnsembleRequest: {
            symbol?: string | null;
            timeframe?: string | null;
        };
        EvidenceIntegrityDto: {
            manifestHashVerified?: boolean;
            reportHashEmbedded?: boolean;
            reportHashVerified?: boolean;
            verificationMode: string;
            verified?: boolean;
        };
        EvidenceIntegritySummaryDto: {
            /** Format: int32 */
            publishedArtifactCount?: number;
            /** Format: int32 */
            rejectedArtifactCount?: number;
            /** Format: int32 */
            scannedArtifactCount?: number;
        };
        ExecutionCostSpecification: {
            /** Format: double */
            feeBpsPerSide?: number;
            instrument?: string | null;
            /** Format: double */
            readonly oneWayCostBps?: number;
            /** Format: double */
            readonly roundTripCostBps?: number;
            /** Format: double */
            readonly roundTripCostFraction?: number;
            /** Format: double */
            readonly roundTripCostPct?: number;
            /** Format: double */
            slippageBpsPerSide?: number;
        };
        FuturesMetricQuality: {
            /** Format: int64 */
            duplicateOpenTimeRows?: number;
            /** Format: int64 */
            latestAgeSeconds?: number | null;
            /** Format: int64 */
            latestOpenTimeMs?: number | null;
            lineage?: components["schemas"]["DerivativeLineageQuality"];
            /** Format: int64 */
            missingFundingRate?: number;
            /** Format: int64 */
            missingLongShortRatio?: number;
            /** Format: int64 */
            missingMarkPrice?: number;
            /** Format: int64 */
            missingOpenInterest?: number;
            /** Format: int64 */
            missingTakerRatio?: number;
            /** Format: int64 */
            rows?: number;
        };
        HealthResponse: {
            /** Format: date-time */
            checkedAtUtc?: string;
            databaseReachable?: boolean;
            klines?: components["schemas"]["KlineFreshness"][] | null;
            status?: string | null;
            symbol?: string | null;
        };
        HistoricalAnalogContextDto: {
            /** Format: int32 */
            availableFeatureCount?: number;
            values?: {
                [key: string]: number;
            } | null;
        };
        HistoricalAnalogEvidenceDto: {
            artifactManifestSha256?: string | null;
            /** Format: int32 */
            evaluatedQueries?: number | null;
            reason?: string | null;
            status?: string | null;
        };
        HistoricalAnalogFreshnessDto: {
            /** Format: double */
            ageSeconds?: number | null;
            /** Format: int64 */
            asOfTimeMs?: number | null;
            reason?: string | null;
            status?: string | null;
        };
        HistoricalAnalogIntervalDto: {
            /** Format: double */
            level?: number;
            /** Format: double */
            lower?: number;
            /** Format: double */
            upper?: number;
        };
        HistoricalAnalogItemDto: {
            /** Format: double */
            atr14Pct?: number;
            /** Format: int32 */
            contextComparableFeatureCount?: number;
            /** Format: double */
            contextSimilarity?: number | null;
            /** Format: int64 */
            endTimeMs?: number;
            /** Format: int64 */
            futureEndTimeMs?: number;
            futureOhlc?: components["schemas"]["ArchetypeOccurrenceOhlcDto"][] | null;
            ohlc?: components["schemas"]["ArchetypeOccurrenceOhlcDto"][] | null;
            outcomes?: components["schemas"]["HistoricalAnalogOutcomeDto"][] | null;
            /** Format: int32 */
            rank?: number;
            /** Format: double */
            shapeSimilarity?: number;
            /** Format: int64 */
            startTimeMs?: number;
            /** Format: double */
            thresholdPct?: number;
            windowId?: string | null;
        };
        HistoricalAnalogOutcomeDto: {
            /** Format: int32 */
            barsAhead?: number;
            /** Format: int32 */
            direction?: number;
            /** Format: double */
            returnPct?: number;
            /** Format: double */
            targetClose?: number;
            /** Format: int64 */
            targetOpenTimeMs?: number;
            /** Format: double */
            thresholdPct?: number;
        };
        HistoricalAnalogQueryDto: {
            /** Format: int64 */
            availableAtTimeMs?: number;
            context?: components["schemas"]["HistoricalAnalogContextDto"];
            /** Format: int64 */
            endTimeMs?: number;
            ohlc?: components["schemas"]["ArchetypeOccurrenceOhlcDto"][] | null;
            /** Format: int64 */
            startTimeMs?: number;
        };
        HistoricalAnalogResponse: {
            abstained?: boolean;
            /** Format: double */
            abstentionRate?: number | null;
            abstentionReason?: string | null;
            /** Format: double */
            atrMultiplier?: number;
            baselineName?: string | null;
            /** Format: double */
            baselineScore?: number | null;
            capabilityState?: string | null;
            contractVersion?: string | null;
            /** Format: double */
            coverage?: number | null;
            /** Format: int64 */
            decisionTimeMs?: number;
            /** Format: int32 */
            effectiveSampleCount?: number;
            evaluationMethod?: string | null;
            evidence?: components["schemas"]["HistoricalAnalogEvidenceDto"];
            /** Format: int32 */
            exclusionBars?: number;
            freshness?: components["schemas"]["HistoricalAnalogFreshnessDto"];
            /** Format: int32 */
            independentCandidateCount?: number;
            /** Format: int64 */
            intervalMs?: number;
            items?: components["schemas"]["HistoricalAnalogItemDto"][] | null;
            /** Format: double */
            lift?: number | null;
            liftConfidenceInterval?: components["schemas"]["HistoricalAnalogIntervalDto"];
            liftUnit?: string | null;
            /** Format: int32 */
            lookbackBars?: number;
            /** Format: double */
            meanSelectedSimilarity?: number | null;
            method?: string | null;
            methodVersion?: string | null;
            /** Format: double */
            minimumMeanSimilarity?: number;
            /** Format: int32 */
            neighborCount?: number;
            /** Format: int32 */
            page?: number;
            /** Format: int32 */
            pageSize?: number;
            readonly qualityGatePassed?: boolean;
            query?: components["schemas"]["HistoricalAnalogQueryDto"];
            rankingMethod?: string | null;
            /** Format: int32 */
            rawCandidateCount?: number;
            requestId?: string | null;
            /** Format: double */
            roundTripCostPct?: number;
            signalBarState?: string | null;
            summaries?: components["schemas"]["HistoricalAnalogSummaryDto"][] | null;
            symbol?: string | null;
            timeframe?: string | null;
            /** Format: int32 */
            total?: number;
            validation?: components["schemas"]["HistoricalAnalogValidationDto"];
            /** Format: int32 */
            windowSize?: number;
        };
        HistoricalAnalogSummaryDto: {
            /** Format: double */
            avgReturnPct?: number;
            /** Format: int32 */
            barsAhead?: number;
            baselineName?: string | null;
            /** Format: double */
            baselineScore?: number | null;
            /** Format: int32 */
            dominantDirection?: number | null;
            /** Format: int32 */
            downCount?: number;
            /** Format: double */
            downRate?: number;
            /** Format: double */
            lift?: number | null;
            liftConfidenceInterval?: components["schemas"]["HistoricalAnalogIntervalDto"];
            liftUnit?: string | null;
            /** Format: double */
            medianReturnPct?: number;
            /** Format: int32 */
            neutralCount?: number;
            /** Format: double */
            neutralRate?: number;
            /** Format: int32 */
            totalSamples?: number;
            /** Format: int32 */
            upCount?: number;
            /** Format: double */
            upRate?: number;
        };
        HistoricalAnalogValidationDto: {
            isOutOfSampleValidated?: boolean;
            reason?: string | null;
            status?: string | null;
        };
        KlineDto: {
            /** Format: double */
            close?: number;
            /** Format: int64 */
            closeTimeMs?: number;
            /** Format: double */
            high?: number;
            /** Format: double */
            low?: number;
            /** Format: double */
            open?: number;
            /** Format: int64 */
            openTimeMs?: number;
            /** Format: double */
            quoteVolume?: number;
            /** Format: double */
            takerBuyQuoteVolume?: number;
            /** Format: double */
            takerBuyVolume?: number;
            timeIso?: string | null;
            /** Format: int32 */
            tradeCount?: number;
            /** Format: double */
            volume?: number;
        };
        KlineFreshness: {
            active?: boolean;
            /** Format: int64 */
            ageSeconds?: number | null;
            /** Format: date-time */
            latestOpenTimeUtc?: string | null;
            /** Format: int64 */
            maxAgeSeconds?: number;
            status?: string | null;
            timeframe?: string | null;
        };
        KlineQualityAudit: {
            /** Format: int64 */
            duplicateOpenTimeRows?: number;
            /** Format: int64 */
            finalizedRows?: number;
            /** Format: int64 */
            formingRows?: number;
            /** Format: int64 */
            invalidOhlcvRows?: number;
            isStale?: boolean;
            /** Format: int64 */
            latestFinalizedAgeSeconds?: number | null;
            /** Format: int64 */
            latestFinalizedCloseTimeMs?: number | null;
        };
        MarketMetricQuality: {
            /** Format: int64 */
            duplicateOpenTimeRows?: number;
            /** Format: int64 */
            latestAgeSeconds?: number | null;
            /** Format: int64 */
            latestOpenTimeMs?: number | null;
            lineage?: components["schemas"]["DerivativeLineageQuality"];
            /** Format: int64 */
            missingFundingRate?: number;
            /** Format: int64 */
            missingLiquidations?: number;
            /** Format: int64 */
            missingLongShortRatio?: number;
            /** Format: int64 */
            missingOpenInterest?: number;
            /** Format: int64 */
            rows?: number;
            timeframe?: string | null;
        };
        MarketTickerDto: {
            /** Format: double */
            askPrice?: number;
            /** Format: double */
            bidPrice?: number;
            /** Format: int64 */
            closeTimeMs?: number;
            /** Format: int32 */
            count?: number;
            /** Format: double */
            highPrice?: number;
            /** Format: double */
            lastPrice?: number;
            /** Format: double */
            lowPrice?: number;
            /** Format: double */
            priceChange?: number;
            /** Format: double */
            priceChangePercent?: number;
            /** Format: double */
            quoteVolume?: number;
            symbol?: string | null;
            /** Format: double */
            volume?: number;
        };
        MarketTradeDto: {
            /** Format: int64 */
            id?: number;
            isBuyer?: boolean;
            isBuyerMaker?: boolean;
            /** Format: double */
            price?: number;
            /** Format: double */
            qty?: number;
            /** Format: double */
            quoteQty?: number;
            /** Format: int64 */
            timeMs?: number;
        };
        MetaResponse: {
            apiContractVersion?: string | null;
            appVersion?: string | null;
            dataPipelineVersion?: string | null;
            environment?: string | null;
            evaluationVersion?: string | null;
        };
        NewsAudit: {
            /** Format: int64 */
            articles?: number;
            /** Format: int64 */
            chunks?: number;
            /** Format: date-time */
            maxDate?: string | null;
            /** Format: date-time */
            minDate?: string | null;
        };
        OrderBookDepthDto: {
            asks?: components["schemas"]["OrderBookEntryDto"][] | null;
            bids?: components["schemas"]["OrderBookEntryDto"][] | null;
            /** Format: int64 */
            lastUpdateId?: number;
            symbol?: string | null;
        };
        OrderBookEntryDto: {
            /** Format: double */
            price?: number;
            /** Format: double */
            qty?: number;
            /** Format: double */
            total?: number;
        };
        PaperObservationDto: {
            abstentionReason?: string | null;
            /** Format: int64 */
            availableTimeMs: number;
            /** Format: double */
            confidence?: number | null;
            configProvenanceJson: string;
            decision: string;
            decisionId: string;
            evidenceProvenanceJson: string;
            /** Format: date-time */
            fillObservedAtUtc?: string | null;
            /** Format: double */
            fillPrice?: number | null;
            /** Format: uuid */
            id: string;
            modelVersion?: string | null;
            /** Format: date-time */
            observedAtUtc: string;
            outcomeHorizon?: string | null;
            /** Format: date-time */
            outcomeObservedAtUtc?: string | null;
            /** Format: double */
            outcomeReturn?: number | null;
            /** Format: double */
            quotePrice?: number | null;
            /** Format: date-time */
            quoteReceivedAtUtc?: string | null;
            /** Format: int64 */
            quoteReceivedTimeMs?: number | null;
            quoteSource: string;
            recorderVersion: string;
            /** Format: int64 */
            signalBarCloseTimeMs: number;
            /** Format: int64 */
            signalBarOpenTimeMs: number;
            symbol: string;
            timeframe: string;
        };
        PaperObservationListResponse: {
            available: boolean;
            items: components["schemas"]["PaperObservationDto"][];
            reason?: string | null;
            symbol: string;
        };
        PatternSearchItem: {
            /** Format: double */
            distance?: number;
            /** Format: int64 */
            endTimeMs?: number;
            featureType?: string | null;
            /** Format: int32 */
            rank?: number;
            /** Format: double */
            similarity?: number;
            /** Format: int64 */
            startTimeMs?: number;
            symbol?: string | null;
            timeframe?: string | null;
            windowId?: string | null;
        };
        PatternSearchRequest: {
            featureType?: string | null;
            /** Format: int32 */
            lookbackBars?: number;
            /** Format: int32 */
            minGapBars?: number | null;
            symbol?: string | null;
            timeframe?: string | null;
            /** Format: int32 */
            topK?: number;
            /** Format: int32 */
            windowSize?: number;
        };
        PatternSearchResponse: {
            featureType?: string | null;
            fromVectorStore?: boolean;
            items?: components["schemas"]["PatternSearchItem"][] | null;
            /** Format: int32 */
            latencyMs?: number;
            requestId?: string | null;
            /** Format: int32 */
            scannedWindows?: number;
            symbol?: string | null;
            timeframe?: string | null;
            /** Format: int32 */
            topK?: number;
            /** Format: int32 */
            windowSize?: number;
        };
        PriceAlertSettingsDto: {
            /** Format: int32 */
            cooldownMinutes?: number;
            enabled?: boolean;
            klineInterval?: string | null;
            /** Format: double */
            priceAboveUsd?: number | null;
            /** Format: double */
            priceBelowUsd?: number | null;
            /** Format: date-time */
            updatedAt?: string;
            userId?: string | null;
        };
        ProblemDetails: {
            detail?: string | null;
            instance?: string | null;
            /** Format: int32 */
            status?: number | null;
            title?: string | null;
            type?: string | null;
        } & {
            [key: string]: unknown;
        };
        ResearchEvidenceArtifactDto: {
            /** Format: int64 */
            bytes?: number;
            role: string;
            /** Format: int64 */
            rowCount?: number | null;
            sha256: string;
        };
        ResearchEvidenceBaselineDto: {
            description: string;
            id: string;
        };
        ResearchEvidenceCatalogItemDto: {
            /** Format: date-time */
            createdAtUtc?: string | null;
            evidenceTier: string;
            id: string;
            integrity: components["schemas"]["EvidenceIntegrityDto"];
            kind: string;
            limitations: string[];
            manifestSha256: string;
            reportSha256: string;
            status: string;
            summary: string;
            symbol: string;
            timeframe: string;
            title: string;
        };
        ResearchEvidenceCatalogResponse: {
            contractVersion: string;
            /** Format: date-time */
            generatedAtUtc: string;
            integrity: components["schemas"]["EvidenceIntegritySummaryDto"];
            items: components["schemas"]["ResearchEvidenceCatalogItemDto"][];
            symbol: string;
        };
        ResearchEvidenceCoverageDto: {
            /** Format: int64 */
            eligibleRows?: number | null;
            /** Format: int64 */
            evaluatedRows?: number | null;
            /** Format: int32 */
            foldCount?: number | null;
            /** Format: double */
            ratio?: number | null;
        };
        ResearchEvidenceDatasetDto: {
            datasetSha256?: string | null;
            /** Format: int64 */
            firstDecisionTimeMs?: number | null;
            /** Format: int64 */
            lastDecisionTimeMs?: number | null;
            /** Format: int64 */
            rowCount?: number | null;
            source: string;
        };
        ResearchEvidenceDetailDto: {
            artifacts: components["schemas"]["ResearchEvidenceArtifactDto"][];
            baselines: components["schemas"]["ResearchEvidenceBaselineDto"][];
            conclusion: string;
            coverage: components["schemas"]["ResearchEvidenceCoverageDto"];
            /** Format: date-time */
            createdAtUtc?: string | null;
            dataset: components["schemas"]["ResearchEvidenceDatasetDto"];
            evidenceTier: string;
            findings: components["schemas"]["ResearchEvidenceFindingDto"][];
            hypothesis: string;
            id: string;
            integrity: components["schemas"]["EvidenceIntegrityDto"];
            kind: string;
            limitations: string[];
            manifestSha256: string;
            metrics: components["schemas"]["ResearchEvidenceMetricDto"][];
            protocol: components["schemas"]["ResearchEvidenceProtocolDto"];
            provenance: components["schemas"]["ResearchEvidenceProvenanceDto"];
            reportSha256: string;
            status: string;
            summary: string;
            symbol: string;
            timeframe: string;
            title: string;
            uncertainty: components["schemas"]["ResearchEvidenceUncertaintyDto"][];
        };
        ResearchEvidenceFindingDto: {
            id: string;
            label: string;
            /** Format: double */
            lower?: number | null;
            metricName: string;
            /** Format: int64 */
            sampleSize?: number | null;
            status: string;
            /** Format: double */
            upper?: number | null;
            /** Format: double */
            value?: number | null;
        };
        ResearchEvidenceMetricDto: {
            baseline?: string | null;
            interpretation?: string | null;
            label: string;
            name: string;
            unit: string;
            /** Format: double */
            value?: number | null;
        };
        ResearchEvidenceProtocolDto: {
            chronologicalOos?: boolean | null;
            decisionTime?: string | null;
            evaluatorVersion?: string | null;
            multipleTesting?: string | null;
            outcomePriceBasis?: string | null;
        };
        ResearchEvidenceProvenanceDto: {
            contractVersion?: string | null;
            evaluatorSha256?: string | null;
            experiment?: string | null;
            gitCommit?: string | null;
            gitDirty?: boolean | null;
            researchContractSha256?: string | null;
        };
        ResearchEvidenceUncertaintyDto: {
            /** Format: double */
            confidenceLevel?: number | null;
            familywise?: boolean;
            /** Format: double */
            lower?: number | null;
            name: string;
            /** Format: double */
            upper?: number | null;
        };
        ResearchSpecificationDto: {
            contractVersion?: string | null;
            costs?: components["schemas"]["ExecutionCostSpecification"];
            decisionTimeRule?: string | null;
            /** Format: double */
            directionLabelDeadZonePct?: number;
            evidenceMaturity?: string | null;
            /** Format: int32 */
            horizonBars?: number;
            horizonElapsed?: string | null;
            marketType?: string | null;
            outcomeDefinition?: string | null;
            promotionEligible?: boolean;
            promotionReason?: string | null;
            sourceTimeframe?: string | null;
            symbol?: string | null;
            venue?: string | null;
        };
        RulesAlertsAudit: {
            /** Format: int64 */
            alerts?: number;
            /** Format: int64 */
            rules?: number;
            /** Format: int64 */
            signals?: number;
        };
        SequencePredictionDto: {
            currentArchetypeCode?: string | null;
            previousArchetypeCode?: string | null;
            reason?: string | null;
            topSequences?: components["schemas"]["SequencePredictionItemDto"][] | null;
            validated?: boolean;
        };
        SequencePredictionItemDto: {
            /** Format: double */
            avgReturnPct?: number;
            /** Format: int32 */
            occurrenceCount?: number;
            /** Format: double */
            outcomeDownRate?: number;
            /** Format: double */
            outcomeSidewaysRate?: number;
            /** Format: double */
            outcomeUpRate?: number;
            thirdArchetypeCode?: string | null;
            /** Format: int64 */
            thirdArchetypeId?: number;
        };
        StreamStatusDto: {
            baseUrl?: string | null;
            /** Format: date-time */
            connectedSince?: string | null;
            currentListenKey?: string | null;
            isConnected?: boolean;
            /** Format: date-time */
            lastEventReceivedTime?: string | null;
            lastEventType?: string | null;
            /** Format: date-time */
            lastPingTime?: string | null;
            /** Format: int32 */
            reconnectCount?: number;
            streamEnabled?: boolean;
            tradingMode?: string | null;
            wsUrl?: string | null;
        };
        TechnicalCapabilitiesResponse: {
            contractVersion: string;
            evidenceCatalogEndpoint: string;
            /** Format: date-time */
            generatedAtUtc: string;
            items: components["schemas"]["TechnicalCapabilityDto"][];
            symbol: string;
        };
        TechnicalCapabilityDto: {
            category: string;
            endpoint: string;
            evidenceStage: string;
            evidenceTarget: string;
            id: string;
            intendedUse: string;
            limitation: string;
            name: string;
            operationalStatus: string;
            version: string;
        };
        TimeframeAudit: {
            active?: boolean;
            /** Format: int64 */
            candlePatterns?: number | null;
            /** Format: double */
            dataCoveragePct?: number;
            derivedTables?: components["schemas"]["DerivedTableAudit"][] | null;
            /** Format: int64 */
            expectedBars?: number | null;
            gapLedgerStatus?: string | null;
            /** Format: int64 */
            gapRangeCount?: number;
            /** Format: int64 */
            largestGapMs?: number;
            /** Format: int64 */
            latestCandleAgeSeconds?: number | null;
            /** Format: int64 */
            maxOpenTimeMs?: number | null;
            /** Format: int64 */
            minOpenTimeMs?: number | null;
            /** Format: int64 */
            missingBars?: number;
            /** Format: int64 */
            mlFeatureStores?: number | null;
            /** Format: int64 */
            pendingGapCount?: number;
            /** Format: int64 */
            priceTargets?: number | null;
            quality?: components["schemas"]["KlineQualityAudit"];
            /** Format: int64 */
            technicalIndicators?: number | null;
            timeframe?: string | null;
            topGaps?: components["schemas"]["CandleGap"][] | null;
            /** Format: int64 */
            totalKlines?: number;
            /** Format: int64 */
            unavailableGapCount?: number;
            /** Format: int64 */
            windowClassificationDatasets?: number | null;
            /** Format: int64 */
            windowVectors?: number | null;
        };
        TransitionMatrixCellDto: {
            /** Format: int32 */
            count?: number;
            fromCode?: string | null;
            /** Format: int64 */
            fromId?: number;
            /** Format: double */
            probability?: number;
            toCode?: string | null;
            /** Format: int64 */
            toId?: number;
        };
        TransitionMatrixDto: {
            /** Format: int32 */
            archetypeCount?: number;
            cells?: components["schemas"]["TransitionMatrixCellDto"][] | null;
            symbol?: string | null;
            timeframe?: string | null;
            /** Format: int32 */
            totalTransitions?: number;
            /** Format: int32 */
            windowSize?: number;
        };
        TransitionPredictionDto: {
            currentArchetypeCode?: string | null;
            /** Format: int64 */
            currentArchetypeId?: number | null;
            /** Format: double */
            entropyBits?: number;
            predictability?: string | null;
            reason?: string | null;
            /** Format: double */
            similarity?: number;
            topTransitions?: components["schemas"]["ArchetypeTransitionDto"][] | null;
            validated?: boolean;
        };
        UpdatePriceAlertSettingsDto: {
            /** Format: int32 */
            cooldownMinutes?: number;
            enabled?: boolean;
            klineInterval?: string | null;
            /** Format: double */
            priceAboveUsd?: number | null;
            /** Format: double */
            priceBelowUsd?: number | null;
        };
        WorkerHealth: {
            /** Format: int64 */
            ageSeconds?: number | null;
            /** Format: int64 */
            lastDurationMs?: number | null;
            /** Format: date-time */
            lastFailedAtUtc?: string | null;
            /** Format: date-time */
            lastStartedAtUtc?: string | null;
            /** Format: date-time */
            lastSucceededAtUtc?: string | null;
            /** Format: int64 */
            maxAgeSeconds?: number;
            message?: string | null;
            name?: string | null;
            status?: string | null;
        };
        WorkerHealthResponse: {
            /** Format: date-time */
            checkedAtUtc?: string;
            workers?: components["schemas"]["WorkerHealth"][] | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
