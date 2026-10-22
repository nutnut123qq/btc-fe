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
                    skip?: number;
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
    "/api/discovery/runs": {
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
    "/api/equities": {
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
                        "application/json": components["schemas"]["EquityInstrumentListResponse"];
                        "text/json": components["schemas"]["EquityInstrumentListResponse"];
                        "text/plain": components["schemas"]["EquityInstrumentListResponse"];
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
    "/api/equities/{symbol}/admin/backfill": {
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
                    from?: string;
                    timeframe?: string;
                    to?: string;
                };
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
                        "application/json": components["schemas"]["MbbTimeframeSync"];
                        "text/json": components["schemas"]["MbbTimeframeSync"];
                        "text/plain": components["schemas"]["MbbTimeframeSync"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/base-rates/rebuild": {
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
                    content?: never;
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Client Error */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                503: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/context/sync": {
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
                        "application/json": components["schemas"]["EquityContextSyncReport"];
                        "text/json": components["schemas"]["EquityContextSyncReport"];
                        "text/plain": components["schemas"]["EquityContextSyncReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/corporate-actions": {
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
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["EquityCorporateActionImport"][];
                    "application/json": components["schemas"]["EquityCorporateActionImport"][];
                    "text/json": components["schemas"]["EquityCorporateActionImport"][];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityImportReport"];
                        "text/json": components["schemas"]["EquityImportReport"];
                        "text/plain": components["schemas"]["EquityImportReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/documents/pipeline": {
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
                    budget?: number;
                    dryRun?: boolean;
                    extractScope?: string;
                    maxDocs?: number;
                    mode?: string;
                };
                header?: never;
                path: {
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityPipelineRunDto"];
                        "text/json": components["schemas"]["EquityPipelineRunDto"];
                        "text/plain": components["schemas"]["EquityPipelineRunDto"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                503: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/documents/pipeline/{runId}/cancel": {
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
                    runId: string;
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Accepted */
                202: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityPipelineRunDto"];
                        "text/json": components["schemas"]["EquityPipelineRunDto"];
                        "text/plain": components["schemas"]["EquityPipelineRunDto"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/events": {
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
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["EquityEventImport"][];
                    "application/json": components["schemas"]["EquityEventImport"][];
                    "text/json": components["schemas"]["EquityEventImport"][];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityImportReport"];
                        "text/json": components["schemas"]["EquityImportReport"];
                        "text/plain": components["schemas"]["EquityImportReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/forecasts/record": {
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
                        "application/json": components["schemas"]["EquityForecastRecordReport"];
                        "text/json": components["schemas"]["EquityForecastRecordReport"];
                        "text/plain": components["schemas"]["EquityForecastRecordReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/fundamentals": {
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
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["EquityFundamentalImport"][];
                    "application/json": components["schemas"]["EquityFundamentalImport"][];
                    "text/json": components["schemas"]["EquityFundamentalImport"][];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityImportReport"];
                        "text/json": components["schemas"]["EquityImportReport"];
                        "text/plain": components["schemas"]["EquityImportReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/observe": {
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
                    timeframe?: string;
                };
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
                        "application/json": components["schemas"]["ObserveReport"];
                        "text/json": components["schemas"]["ObserveReport"];
                        "text/plain": components["schemas"]["ObserveReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/recompute": {
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
                    timeframe?: string;
                };
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
                        "application/json": components["schemas"]["MbbTechnicalRecomputeReport"][];
                        "text/json": components["schemas"]["MbbTechnicalRecomputeReport"][];
                        "text/plain": components["schemas"]["MbbTechnicalRecomputeReport"][];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/source-documents": {
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
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["EquitySourceDocumentRegistration"];
                    "application/json": components["schemas"]["EquitySourceDocumentRegistration"];
                    "text/json": components["schemas"]["EquitySourceDocumentRegistration"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquitySourceDocumentRegistrationResult"];
                        "text/json": components["schemas"]["EquitySourceDocumentRegistrationResult"];
                        "text/plain": components["schemas"]["EquitySourceDocumentRegistrationResult"];
                    };
                };
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquitySourceDocumentRegistrationResult"];
                        "text/json": components["schemas"]["EquitySourceDocumentRegistrationResult"];
                        "text/plain": components["schemas"]["EquitySourceDocumentRegistrationResult"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Client Error */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                503: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/admin/sync": {
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
                        "application/json": components["schemas"]["MbbSyncReport"];
                        "text/json": components["schemas"]["MbbSyncReport"];
                        "text/plain": components["schemas"]["MbbSyncReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/base-rates": {
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
                        "application/json": components["schemas"]["EquityBaseRatesResponse"];
                        "text/json": components["schemas"]["EquityBaseRatesResponse"];
                        "text/plain": components["schemas"]["EquityBaseRatesResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/candles": {
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
                    limit?: number;
                    timeframe?: string;
                };
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
                        "application/json": components["schemas"]["MbbCandleDto"][];
                        "text/json": components["schemas"]["MbbCandleDto"][];
                        "text/plain": components["schemas"]["MbbCandleDto"][];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/conditions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    timeframe?: string;
                };
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
                    content?: never;
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
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                502: {
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
    "/api/equities/{symbol}/context": {
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
                        "application/json": components["schemas"]["EquityContextResponse"];
                        "text/json": components["schemas"]["EquityContextResponse"];
                        "text/plain": components["schemas"]["EquityContextResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/data-quality": {
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
                        "application/json": components["schemas"]["MbbCoverageReport"];
                        "text/json": components["schemas"]["MbbCoverageReport"];
                        "text/plain": components["schemas"]["MbbCoverageReport"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/decision": {
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
                        "application/json": components["schemas"]["MbbDecisionDto"];
                        "text/json": components["schemas"]["MbbDecisionDto"];
                        "text/plain": components["schemas"]["MbbDecisionDto"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/documents/pipeline-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    take?: number;
                };
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
                        "application/json": components["schemas"]["EquityPipelineRunListResponse"];
                        "text/json": components["schemas"]["EquityPipelineRunListResponse"];
                        "text/plain": components["schemas"]["EquityPipelineRunListResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/dossier": {
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
                        "application/json": components["schemas"]["EquityDossierResponse"];
                        "text/json": components["schemas"]["EquityDossierResponse"];
                        "text/plain": components["schemas"]["EquityDossierResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/financial-facts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    asOf?: string;
                    from?: string;
                    metric?: string;
                    periodType?: string;
                    status?: string;
                    take?: number;
                    to?: string;
                };
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
                        "application/json": components["schemas"]["EquityFinancialFactsResponse"];
                        "text/json": components["schemas"]["EquityFinancialFactsResponse"];
                        "text/plain": components["schemas"]["EquityFinancialFactsResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/forecast-journal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    configId?: string;
                    take?: number;
                };
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
                        "application/json": components["schemas"]["EquityForecastJournalResponse"];
                        "text/json": components["schemas"]["EquityForecastJournalResponse"];
                        "text/plain": components["schemas"]["EquityForecastJournalResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/fundamentals/coverage": {
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
                        "application/json": components["schemas"]["EquityFundamentalsCoverageResponse"];
                        "text/json": components["schemas"]["EquityFundamentalsCoverageResponse"];
                        "text/plain": components["schemas"]["EquityFundamentalsCoverageResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/llm-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    take?: number;
                };
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
                        "application/json": components["schemas"]["EquityLlmRunListResponse"];
                        "text/json": components["schemas"]["EquityLlmRunListResponse"];
                        "text/plain": components["schemas"]["EquityLlmRunListResponse"];
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
                /** @description Not Found */
                404: {
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
        post: {
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
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityLlmRunDto"];
                        "text/json": components["schemas"]["EquityLlmRunDto"];
                        "text/plain": components["schemas"]["EquityLlmRunDto"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                502: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityLlmRunErrorEnvelope"];
                        "text/json": components["schemas"]["EquityLlmRunErrorEnvelope"];
                        "text/plain": components["schemas"]["EquityLlmRunErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityLlmRunErrorEnvelope"];
                        "text/json": components["schemas"]["EquityLlmRunErrorEnvelope"];
                        "text/plain": components["schemas"]["EquityLlmRunErrorEnvelope"];
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
    "/api/equities/{symbol}/observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    take?: number;
                    timeframe?: string;
                };
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
                        "application/json": components["schemas"]["MbbObservationDto"][];
                        "text/json": components["schemas"]["MbbObservationDto"][];
                        "text/plain": components["schemas"]["MbbObservationDto"][];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/position": {
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
                        "application/json": components["schemas"]["MbbPositionDto"];
                        "text/json": components["schemas"]["MbbPositionDto"];
                        "text/plain": components["schemas"]["MbbPositionDto"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["UpdateMbbPositionRequest"];
                    "application/json": components["schemas"]["UpdateMbbPositionRequest"];
                    "text/json": components["schemas"]["UpdateMbbPositionRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MbbPositionDto"];
                        "text/json": components["schemas"]["MbbPositionDto"];
                        "text/plain": components["schemas"]["MbbPositionDto"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/research-notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    take?: number;
                };
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
                        "application/json": components["schemas"]["EquityResearchNoteListResponse"];
                        "text/json": components["schemas"]["EquityResearchNoteListResponse"];
                        "text/plain": components["schemas"]["EquityResearchNoteListResponse"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
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
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    symbol: string;
                };
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["EquityResearchNoteRequest"];
                    "application/json": components["schemas"]["EquityResearchNoteRequest"];
                    "text/json": components["schemas"]["EquityResearchNoteRequest"];
                };
            };
            responses: {
                /** @description Created */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityResearchNoteDto"];
                        "text/json": components["schemas"]["EquityResearchNoteDto"];
                        "text/plain": components["schemas"]["EquityResearchNoteDto"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Not Found */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/equities/{symbol}/research-readiness": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    asOf?: string;
                };
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
                        "application/json": components["schemas"]["EquityResearchReadiness"];
                        "text/json": components["schemas"]["EquityResearchReadiness"];
                        "text/plain": components["schemas"]["EquityResearchReadiness"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/research-snapshot": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    asOf?: string;
                };
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
                        "application/json": components["schemas"]["EquityResearchSnapshot"];
                        "text/json": components["schemas"]["EquityResearchSnapshot"];
                        "text/plain": components["schemas"]["EquityResearchSnapshot"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/{symbol}/source-documents": {
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
                        "application/json": components["schemas"]["EquitySourceDocumentListResponse"];
                        "text/json": components["schemas"]["EquitySourceDocumentListResponse"];
                        "text/plain": components["schemas"]["EquitySourceDocumentListResponse"];
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
                /** @description Not Found */
                404: {
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
    "/api/equities/cash": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["UpdateEquityCashRequest"];
                    "application/json": components["schemas"]["UpdateEquityCashRequest"];
                    "text/json": components["schemas"]["UpdateEquityCashRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["EquityCashDto"];
                        "text/json": components["schemas"]["EquityCashDto"];
                        "text/plain": components["schemas"]["EquityCashDto"];
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
                /** @description Unauthorized */
                401: {
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
    "/api/instruments": {
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
                        "application/json": components["schemas"]["InstrumentsResponse"];
                        "text/json": components["schemas"]["InstrumentsResponse"];
                        "text/plain": components["schemas"]["InstrumentsResponse"];
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
    "/api/market-calendar/vn-hose": {
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
                        "application/json": components["schemas"]["MarketCalendarResponse"];
                        "text/json": components["schemas"]["MarketCalendarResponse"];
                        "text/plain": components["schemas"]["MarketCalendarResponse"];
                    };
                };
                /** @description Server Error */
                503: {
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
    "/api/market/data-quality/issues": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    endOpenTimeMs?: number;
                    limit?: number;
                    startOpenTimeMs?: number;
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
                    content: {
                        "application/json": components["schemas"]["KlineDataIssuesResponse"];
                        "text/json": components["schemas"]["KlineDataIssuesResponse"];
                        "text/plain": components["schemas"]["KlineDataIssuesResponse"];
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
    "/api/market/data-quality/repair": {
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
                    "application/*+json": components["schemas"]["KlineDataRepairRequest"];
                    "application/json": components["schemas"]["KlineDataRepairRequest"];
                    "text/json": components["schemas"]["KlineDataRepairRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["KlineDataRepairResponse"];
                        "text/json": components["schemas"]["KlineDataRepairResponse"];
                        "text/plain": components["schemas"]["KlineDataRepairResponse"];
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
                /** @description Conflict */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/json": components["schemas"]["ApiErrorEnvelope"];
                        "text/plain": components["schemas"]["ApiErrorEnvelope"];
                    };
                };
                /** @description Server Error */
                502: {
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
    "/api/mbb/admin/backfill": {
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
                    from?: string;
                    timeframe?: string;
                    to?: string;
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
                        "application/json": components["schemas"]["MbbTimeframeSync"];
                        "text/json": components["schemas"]["MbbTimeframeSync"];
                        "text/plain": components["schemas"]["MbbTimeframeSync"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mbb/admin/observe": {
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
                    content: {
                        "application/json": components["schemas"]["ObserveReport"];
                        "text/json": components["schemas"]["ObserveReport"];
                        "text/plain": components["schemas"]["ObserveReport"];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mbb/admin/recompute": {
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
                    content: {
                        "application/json": components["schemas"]["MbbTechnicalRecomputeReport"][];
                        "text/json": components["schemas"]["MbbTechnicalRecomputeReport"][];
                        "text/plain": components["schemas"]["MbbTechnicalRecomputeReport"][];
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
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mbb/admin/sync": {
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
                    content: {
                        "application/json": components["schemas"]["MbbSyncReport"];
                        "text/json": components["schemas"]["MbbSyncReport"];
                        "text/plain": components["schemas"]["MbbSyncReport"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                        "text/plain": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Conflict */
                409: {
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
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/mbb/candles": {
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
                    limit?: number;
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
                    content: {
                        "application/json": components["schemas"]["MbbCandleDto"][];
                        "text/json": components["schemas"]["MbbCandleDto"][];
                        "text/plain": components["schemas"]["MbbCandleDto"][];
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
    "/api/mbb/conditions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
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
                /** @description Server Error */
                502: {
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
    "/api/mbb/data-quality": {
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
                        "application/json": components["schemas"]["MbbCoverageReport"];
                        "text/json": components["schemas"]["MbbCoverageReport"];
                        "text/plain": components["schemas"]["MbbCoverageReport"];
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
    "/api/mbb/decision": {
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
                        "application/json": components["schemas"]["MbbDecisionDto"];
                        "text/json": components["schemas"]["MbbDecisionDto"];
                        "text/plain": components["schemas"]["MbbDecisionDto"];
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
    "/api/mbb/observations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
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
                    content: {
                        "application/json": components["schemas"]["MbbObservationDto"][];
                        "text/json": components["schemas"]["MbbObservationDto"][];
                        "text/plain": components["schemas"]["MbbObservationDto"][];
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
                /** @description Unauthorized */
                401: {
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
    "/api/mbb/position": {
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
                        "application/json": components["schemas"]["MbbPositionDto"];
                        "text/json": components["schemas"]["MbbPositionDto"];
                        "text/plain": components["schemas"]["MbbPositionDto"];
                    };
                };
            };
        };
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/*+json": components["schemas"]["UpdateMbbPositionRequest"];
                    "application/json": components["schemas"]["UpdateMbbPositionRequest"];
                    "text/json": components["schemas"]["UpdateMbbPositionRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["MbbPositionDto"];
                        "text/json": components["schemas"]["MbbPositionDto"];
                        "text/plain": components["schemas"]["MbbPositionDto"];
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
        post?: never;
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
    "/api/research/current-conditions": {
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
                /** @description Server Error */
                502: {
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
    "/api/smart-money/causal-coverage": {
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
                    content: {
                        "application/json": components["schemas"]["CausalSmartMoneyCoverageResponse"];
                        "text/json": components["schemas"]["CausalSmartMoneyCoverageResponse"];
                        "text/plain": components["schemas"]["CausalSmartMoneyCoverageResponse"];
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
    "/api/smart-money/causal-rebuild": {
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
                    "application/*+json": components["schemas"]["CausalSmartMoneyRebuildRequest"];
                    "application/json": components["schemas"]["CausalSmartMoneyRebuildRequest"];
                    "text/json": components["schemas"]["CausalSmartMoneyRebuildRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["CausalSmartMoneyRebuildResult"];
                        "text/json": components["schemas"]["CausalSmartMoneyRebuildResult"];
                        "text/plain": components["schemas"]["CausalSmartMoneyRebuildResult"];
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
                /** @description Conflict */
                409: {
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
    "/api/smart-money/replay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: {
                    asOfTimeMs?: number;
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
                    content: {
                        "application/json": components["schemas"]["TechnicalReplayResponse"];
                        "text/json": components["schemas"]["TechnicalReplayResponse"];
                        "text/plain": components["schemas"]["TechnicalReplayResponse"];
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
                /** @description Conflict */
                409: {
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
    "/api/smart-money/replay/coverage": {
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
                    content: {
                        "application/json": components["schemas"]["TechnicalEvidenceCoverageResponse"];
                        "text/json": components["schemas"]["TechnicalEvidenceCoverageResponse"];
                        "text/plain": components["schemas"]["TechnicalEvidenceCoverageResponse"];
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
    "/api/smart-money/replay/rebuild": {
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
                    "application/*+json": components["schemas"]["TechnicalEvidenceRebuildRequest"];
                    "application/json": components["schemas"]["TechnicalEvidenceRebuildRequest"];
                    "text/json": components["schemas"]["TechnicalEvidenceRebuildRequest"];
                };
            };
            responses: {
                /** @description Success */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TechnicalEvidenceRebuildResult"];
                        "text/json": components["schemas"]["TechnicalEvidenceRebuildResult"];
                        "text/plain": components["schemas"]["TechnicalEvidenceRebuildResult"];
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
                /** @description Conflict */
                409: {
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
        CandleGapRange: {
            /** Format: int64 */
            endOpenTimeMs?: number;
            /** Format: int64 */
            missingBars?: number;
            /** Format: int64 */
            startOpenTimeMs?: number;
        };
        CandlePatternEventDto: {
            /** Format: int64 */
            availableTimeMs?: number;
            /** Format: int64 */
            originTimeMs?: number;
            patternCategory?: string | null;
            patternType?: string | null;
            sourceOpenTimeMs?: number[] | null;
            trendDirection?: string | null;
        };
        CandlePatternReplayDto: {
            events?: components["schemas"]["CandlePatternEventDto"][] | null;
        };
        CandlePatternReplayDtoTechnicalLayerEnvelopeDto: {
            availability?: string | null;
            layerKey?: string | null;
            limitations?: string[] | null;
            lineage?: components["schemas"]["TechnicalLayerLineageDto"];
            payload?: components["schemas"]["CandlePatternReplayDto"];
            unavailableReason?: string | null;
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
        CausalSmartMoneyCoverageResponse: {
            calculationVersion?: string | null;
            checkpointStatus?: string | null;
            /** Format: int64 */
            coverageStartOpenTimeMs?: number | null;
            eventsByType?: {
                [key: string]: number;
            } | null;
            /** Format: int64 */
            historicalPendingGapRanges?: number;
            /** Format: int64 */
            invalidDurationRows?: number;
            /** Format: int64 */
            lastProcessedOpenTimeMs?: number | null;
            /** Format: int64 */
            latestSegmentStartOpenTimeMs?: number | null;
            legacyStorageStatus?: string | null;
            /** Format: int64 */
            materializedEventCount?: number;
            /** Format: int64 */
            persistedEventCount?: number;
            /** Format: int64 */
            processedCandleCount?: number;
            symbol?: string | null;
            timeframe?: string | null;
            /** Format: int64 */
            trailingNotYetFinalizedGapRanges?: number;
            /** Format: int64 */
            unavailableGapRanges?: number;
        };
        CausalSmartMoneyGapBoundaryDto: {
            boundaryType?: string | null;
            /** Format: int64 */
            gapStateId?: number | null;
            /** Format: int64 */
            invalidOpenTimeMs?: number | null;
            ledgerStatus?: string | null;
            /** Format: int64 */
            missingBars?: number;
            /** Format: int64 */
            nextOpenTimeMs?: number | null;
            /** Format: int64 */
            previousOpenTimeMs?: number | null;
        };
        CausalSmartMoneyRebuildRequest: {
            dryRun?: boolean;
            /** Format: int32 */
            maxCandles?: number;
            previewFromBeginning?: boolean;
            symbol?: string | null;
            timeframe?: string | null;
        };
        CausalSmartMoneyRebuildResult: {
            /** Format: int64 */
            batchStartOpenTimeMs?: number | null;
            calculationVersion?: string | null;
            /** Format: int32 */
            candidateCandles?: number;
            /** Format: int32 */
            contextCandles?: number;
            /** Format: int32 */
            contiguousSegments?: number;
            /** Format: int64 */
            coverageStartOpenTimeMs?: number | null;
            dryRun?: boolean;
            /** Format: int32 */
            estimatedEvents?: number;
            /** Format: int64 */
            estimatedEvidenceBytes?: number;
            /** Format: int32 */
            existingEvents?: number;
            gapBoundaries?: components["schemas"]["CausalSmartMoneyGapBoundaryDto"][] | null;
            /** Format: int32 */
            insertedEvents?: number;
            /** Format: int32 */
            invalidDurationCandles?: number;
            /** Format: int64 */
            lastProcessedOpenTimeMs?: number | null;
            limitations?: string[] | null;
            /** Format: int64 */
            previousCheckpointOpenTimeMs?: number | null;
            status?: string | null;
            symbol?: string | null;
            timeframe?: string | null;
            /** Format: int32 */
            updatedEvents?: number;
            /** Format: int32 */
            validCandidateCandles?: number;
        };
        ConfluenceModuleVoteDto: {
            /** Format: int64 */
            availableTimeMs?: number;
            layerKey?: string | null;
            reason?: string | null;
            /** Format: int32 */
            vote?: number;
        };
        ConfluenceReplayDto: {
            /** Format: int32 */
            alignedDirectionalModules?: number;
            /** Format: int64 */
            availableTimeMs?: number;
            eventType?: string | null;
            hasConflict?: boolean;
            isProbability?: boolean;
            moduleVotes?: components["schemas"]["ConfluenceModuleVoteDto"][] | null;
            overallDirection?: string | null;
            /** Format: double */
            score?: number;
            scoreKind?: string | null;
            triggeredEvents?: string[] | null;
        };
        ConfluenceReplayDtoTechnicalLayerEnvelopeDto: {
            availability?: string | null;
            layerKey?: string | null;
            limitations?: string[] | null;
            lineage?: components["schemas"]["TechnicalLayerLineageDto"];
            payload?: components["schemas"]["ConfluenceReplayDto"];
            unavailableReason?: string | null;
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
        EquityBaseRatesArtifactInfo: {
            /** Format: int64 */
            dataAsOfOpenTimeMs?: number;
            datasetSha256?: string | null;
            generatedAtUtc?: string | null;
            methodVersion?: string | null;
            priceBasis?: string | null;
            protocolVersion?: string | null;
        };
        EquityBaseRatesConfigDto: {
            abstained?: boolean;
            abstainReasons?: string[] | null;
            configId?: string | null;
            decisionUse?: components["schemas"]["EquityBaseRatesDecisionUse"];
            /** Format: int32 */
            horizonSessions?: number;
            research?: components["schemas"]["EquityBaseRatesResearch"];
            /** Format: double */
            stopPct?: number;
            /** Format: double */
            targetPct?: number;
            validation?: components["schemas"]["EquityBaseRatesValidation"];
        };
        EquityBaseRatesDecisionUse: {
            /** Format: double */
            evNetFraction?: number | null;
            /** Format: double */
            probStopFirst?: number;
            /** Format: double */
            probTargetFirst?: number;
            /** Format: double */
            probTimeout?: number;
        };
        EquityBaseRatesPrior: {
            /** Format: double */
            probStopFirst?: number | null;
            /** Format: double */
            probTargetFirst?: number | null;
            /** Format: double */
            probTimeout?: number | null;
        };
        EquityBaseRatesResearch: {
            /** Format: double */
            evNetFraction?: number | null;
            /** Format: int32 */
            k?: number | null;
            label?: string | null;
            /** Format: int32 */
            nEligible?: number;
            prior?: components["schemas"]["EquityBaseRatesPrior"];
            /** Format: double */
            probStopFirst?: number;
            /** Format: double */
            probTargetFirst?: number;
            /** Format: double */
            probTimeout?: number;
            /** Format: int64 */
            signalBarOpenTimeMs?: number;
        };
        EquityBaseRatesResponse: {
            artifact?: components["schemas"]["EquityBaseRatesArtifactInfo"];
            configs?: components["schemas"]["EquityBaseRatesConfigDto"][] | null;
            contractVersion?: string | null;
            reasons?: string[] | null;
            status?: string | null;
            symbol?: string | null;
            timeframe?: string | null;
        };
        EquityBaseRatesValidation: {
            /** Format: double */
            abstentionRate?: number | null;
            brierDiffCi90?: number[] | null;
            /** Format: double */
            brierDiffMean?: number | null;
            /** Format: double */
            brierKnn?: number | null;
            /** Format: double */
            brierPrior?: number | null;
            calibrationBins?: components["schemas"]["EquityCalibrationBin"][] | null;
            /** Format: double */
            coverage?: number | null;
            /** Format: double */
            ece?: number | null;
            /** Format: double */
            evNetOosMean?: number | null;
            /** Format: double */
            evNetOosWhenPositive?: number | null;
            gatePassed?: boolean;
            gateReasons?: string[] | null;
            /** Format: int32 */
            nEffective?: number | null;
            /** Format: int32 */
            nOos?: number | null;
        };
        EquityBuyBudgetDto: {
            /** Format: double */
            buyBudgetVnd?: number | null;
            symbol: string;
        };
        EquityCalibrationBin: {
            /** Format: double */
            lower?: number;
            /** Format: double */
            meanPredicted?: number | null;
            /** Format: int32 */
            n?: number;
            /** Format: double */
            observedRate?: number | null;
            /** Format: double */
            upper?: number;
        };
        EquityCapabilitiesDto: {
            decision?: boolean;
            ingestion?: boolean;
            technicalAnalysis?: boolean;
        };
        EquityCashDto: {
            accountId: string;
            /** Format: double */
            availableCashVnd?: number | null;
            budgets: components["schemas"]["EquityBuyBudgetDto"][];
            budgetsExceedCash: boolean;
            notes: string[];
            /** Format: double */
            totalDeclaredBudgetsVnd: number;
            /** Format: date-time */
            updatedAtUtc?: string | null;
        };
        EquityContextResponse: {
            contractVersion?: string | null;
            corporateActions?: components["schemas"]["EquityCorporateActionsSection"];
            events?: components["schemas"]["EquityEventsSection"];
            fundamentals?: components["schemas"]["EquityFundamentalsSection"];
            /** Format: date-time */
            generatedAtUtc?: string;
            limitations?: string[] | null;
            relativeStrength?: components["schemas"]["EquityRelativeStrengthSection"];
            symbol?: string | null;
        };
        EquityContextSyncReport: {
            /** Format: int32 */
            corporateActionsUpserted?: number;
            errors?: string[] | null;
            /** Format: int32 */
            eventsUpserted?: number;
            /** Format: int32 */
            fundamentalsUpserted?: number;
            /** Format: date-time */
            generatedAtUtc?: string;
            /** Format: int32 */
            providerRequests?: number;
            /** Format: int32 */
            skippedRows?: number;
            status?: string | null;
            symbol?: string | null;
        };
        EquityCorporateActionDto: {
            actionType?: string | null;
            /** Format: double */
            adjustmentFactor?: number | null;
            announcedDate?: string | null;
            availabilityBasis?: string | null;
            availabilityReason?: string | null;
            /** Format: date-time */
            availableAtUtc?: string;
            /** Format: double */
            cashPerShareVnd?: number | null;
            exDate?: string | null;
            provenance?: string | null;
            /** Format: date-time */
            publishedAvailableAtUtc?: string | null;
            ratioText?: string | null;
            recordDate?: string | null;
            /** Format: double */
            shareRatio?: number | null;
            sourceUrl?: string | null;
            verificationStatus?: string | null;
        };
        EquityCorporateActionImport: {
            actionType?: string | null;
            /** Format: double */
            adjustmentFactor?: number | null;
            announcedDate?: string | null;
            /** Format: date-time */
            availableAtUtc?: string | null;
            /** Format: double */
            cashPerShareVnd?: number | null;
            exDate?: string | null;
            ratioText?: string | null;
            recordDate?: string | null;
            /** Format: double */
            shareRatio?: number | null;
            sourceUrl?: string | null;
            verificationStatus?: string | null;
        };
        EquityCorporateActionsSection: {
            items?: components["schemas"]["EquityCorporateActionDto"][] | null;
            reason?: string | null;
            status?: string | null;
        };
        EquityCoverageCatalogInfo: {
            coreMetrics?: string[] | null;
            coreMetricsFromCatalog?: boolean;
            /** Format: int32 */
            metricCount?: number;
            reason?: string | null;
            sha256?: string | null;
            status?: string | null;
            version?: string | null;
        };
        EquityCoverageCell: {
            /** Format: int64 */
            attemptId?: number | null;
            attemptOutcome?: string | null;
            consolidation?: string | null;
            counts?: components["schemas"]["EquityCoverageCellCounts"];
            /** Format: uuid */
            documentId?: string | null;
            /** Format: uuid */
            extractionId?: string | null;
            extractorVersion?: string | null;
            metricGroup?: string | null;
            missingMetrics?: string[] | null;
            period?: string | null;
            periodKind?: string | null;
            reason?: string | null;
            source?: string | null;
            sourceDocumentIds?: string[] | null;
            stage?: string | null;
        };
        EquityCoverageCellCounts: {
            /** Format: int32 */
            derived?: number;
            /** Format: int32 */
            documents?: number;
            /** Format: int32 */
            expectedMetrics?: number;
            /** Format: int32 */
            extracted?: number;
            /** Format: int32 */
            extractions?: number;
            /** Format: int32 */
            facts?: number;
            /** Format: int32 */
            quarantined?: number;
            /** Format: int32 */
            reviewNeeded?: number;
            /** Format: int32 */
            validated?: number;
            /** Format: int32 */
            validatedMetrics?: number;
        };
        EquityCoverageSummary: {
            /** Format: int32 */
            attempts?: number;
            byPeriodKind?: {
                [key: string]: {
                    [key: string]: number;
                };
            } | null;
            byStage?: {
                [key: string]: number;
            } | null;
            /** Format: int32 */
            cells?: number;
            comparativeOnlyByStage?: {
                [key: string]: number;
            } | null;
            /** Format: int32 */
            comparativeOnlyCells?: number;
            /** Format: int32 */
            documents?: number;
            /** Format: int32 */
            extractions?: number;
            /** Format: int32 */
            facts?: number;
            /** Format: int32 */
            quarantinedFacts?: number;
            /** Format: int32 */
            reviewNeededFacts?: number;
            /** Format: int32 */
            validatedFacts?: number;
        };
        EquityDocumentExtractionStatusDto: {
            extractorVersion?: string | null;
            /** Format: int32 */
            facts?: number;
            method?: string | null;
            /** Format: int32 */
            pageCount?: number | null;
            /** Format: int32 */
            pagesOcr?: number | null;
            status?: string | null;
            /** Format: int32 */
            validatedFacts?: number;
        };
        EquityDossierResponse: {
            /** Format: date-time */
            asOfUtc?: string;
            baseRates?: components["schemas"]["EquityBaseRatesResponse"];
            conditions?: {
                [key: string]: components["schemas"]["JsonNode"];
            } | null;
            context?: components["schemas"]["EquityContextResponse"];
            contractVersion?: string | null;
            journalSummary?: components["schemas"]["EquityForecastScoringDto"][] | null;
            latestLlmRun?: components["schemas"]["EquityLlmRunDto"];
            /** Format: int64 */
            signalBarOpenTimeMs?: number | null;
            symbol?: string | null;
        };
        EquityEventDto: {
            availabilityBasis?: string | null;
            availabilityReason?: string | null;
            /** Format: date-time */
            availableAtUtc?: string;
            eventDate?: string | null;
            eventType?: string | null;
            provenance?: string | null;
            /** Format: date-time */
            publishedAvailableAtUtc?: string | null;
            sourceUrl?: string | null;
            title?: string | null;
        };
        EquityEventImport: {
            /** Format: date-time */
            availableAtUtc?: string | null;
            eventDate?: string | null;
            eventType?: string | null;
            sourceUrl?: string | null;
            title?: string | null;
        };
        EquityEventsSection: {
            items?: components["schemas"]["EquityEventDto"][] | null;
            reason?: string | null;
            status?: string | null;
        };
        EquityFactDocumentRef: {
            availabilityBasis?: string | null;
            /** Format: date-time */
            availableAtUtc?: string;
            docType?: string | null;
            /** Format: uuid */
            documentId?: string;
            provider?: string | null;
            reportingPeriod?: string | null;
            /** Format: int32 */
            revision?: number;
            sha256?: string | null;
            title?: string | null;
            url?: string | null;
        };
        EquityFactExtractionRef: {
            /** Format: uuid */
            extractionId?: string;
            extractorVersion?: string | null;
            /** Format: date-time */
            finishedAtUtc?: string;
            method?: string | null;
            /** Format: int32 */
            pageCount?: number;
            /** Format: int32 */
            pagesOcr?: number;
            status?: string | null;
        };
        EquityFinancialFactDto: {
            /** Format: date-time */
            availableAtUtc?: string;
            columnRole?: string | null;
            consolidation?: string | null;
            derivation?: unknown;
            document?: components["schemas"]["EquityFactDocumentRef"];
            extraction?: components["schemas"]["EquityFactExtractionRef"];
            factKey?: string | null;
            /** Format: int32 */
            fiscalYear?: number;
            isDerived?: boolean;
            location?: string | null;
            metricCode?: string | null;
            metricDefinitionVersion?: string | null;
            metricGroup?: string | null;
            /** Format: double */
            normalizedValue?: number | null;
            /** Format: int32 */
            page?: number | null;
            periodEnd?: string | null;
            periodLabel?: string | null;
            periodStart?: string | null;
            periodType?: string | null;
            rawLabel?: string | null;
            rawUnitText?: string | null;
            rawValueText?: string | null;
            /** Format: double */
            scale?: number;
            selected?: boolean;
            selection?: string | null;
            statement?: string | null;
            status?: string | null;
            unit?: string | null;
            validation?: unknown;
            /** Format: double */
            value?: number;
        };
        EquityFinancialFactsResponse: {
            /** Format: date-time */
            asOfUtc?: string;
            contractVersion?: string | null;
            /** Format: int32 */
            count?: number;
            from?: string | null;
            items?: components["schemas"]["EquityFinancialFactDto"][] | null;
            metrics?: string[] | null;
            periodType?: string | null;
            rules?: string[] | null;
            statusFilter?: string | null;
            symbol?: string | null;
            to?: string | null;
            truncated?: boolean;
        };
        EquityForecastItemDto: {
            abstained?: boolean;
            abstainReason?: string | null;
            /** Format: int64 */
            availableTimeMs?: number;
            configId?: string | null;
            /** Format: date-time */
            createdAtUtc?: string;
            forecastId?: string | null;
            /** Format: int32 */
            horizonSessions?: number;
            /** Format: uuid */
            llmRunId?: string | null;
            methodVersion?: string | null;
            modelId?: string | null;
            outcome?: components["schemas"]["EquityForecastOutcomeDto"];
            /** Format: double */
            probStopFirst?: number | null;
            /** Format: double */
            probTargetFirst?: number | null;
            promptVersion?: string | null;
            /** Format: int64 */
            signalBarOpenTimeMs?: number;
            source?: string | null;
            /** Format: double */
            stopPct?: number;
            /** Format: double */
            targetPct?: number;
            validated?: boolean;
        };
        EquityForecastJournalResponse: {
            contractVersion?: string | null;
            items?: components["schemas"]["EquityForecastItemDto"][] | null;
            scoring?: components["schemas"]["EquityForecastScoringDto"][] | null;
            symbol?: string | null;
        };
        EquityForecastOutcomeDto: {
            /** Format: int64 */
            entryBarOpenTimeMs?: number;
            /** Format: double */
            entryPrice?: number;
            label?: string | null;
            /** Format: date-time */
            resolvedAtUtc?: string;
            /** Format: int64 */
            resolvedBarOpenTimeMs?: number;
            /** Format: double */
            returnNet?: number;
        };
        EquityForecastPairScoreDto: {
            /** Format: double */
            brierChallenger?: number | null;
            /** Format: double */
            brierDiff?: number | null;
            /** Format: double */
            brierQuant?: number | null;
            /** Format: double */
            coverageChallenger?: number | null;
            /** Format: double */
            coverageQuant?: number | null;
            /** Format: int32 */
            nEffective?: number;
            /** Format: int32 */
            pairedN?: number;
            source?: string | null;
            status?: string | null;
        };
        EquityForecastRecordReport: {
            /** Format: int32 */
            abstained?: number;
            /** Format: int32 */
            alreadyRecorded?: number;
            detail?: string | null;
            /** Format: int32 */
            recorded?: number;
            /** Format: int64 */
            signalBarOpenTimeMs?: number | null;
            status?: string | null;
            symbol?: string | null;
        };
        EquityForecastScoringDto: {
            /** Format: double */
            brierDiff?: number | null;
            /** Format: double */
            brierLlm?: number | null;
            /** Format: double */
            brierQuant?: number | null;
            configId?: string | null;
            /** Format: double */
            coverageLlm?: number | null;
            /** Format: double */
            coverageQuant?: number | null;
            /** Format: int32 */
            nEffective?: number;
            /** Format: int32 */
            pairedN?: number;
            pairs?: components["schemas"]["EquityForecastPairScoreDto"][] | null;
            status?: string | null;
        };
        EquityFundamentalDto: {
            /** Format: date-time */
            asOfUtc?: string | null;
            /** Format: date-time */
            availableAtUtc?: string | null;
            /** Format: uuid */
            documentId?: string | null;
            metric?: string | null;
            note?: string | null;
            period?: string | null;
            periodEndDate?: string | null;
            publishedDate?: string | null;
            source?: string | null;
            sourceLocation?: string | null;
            sourceUrl?: string | null;
            unavailableReason?: string | null;
            unit?: string | null;
            /** Format: double */
            value?: number | null;
        };
        EquityFundamentalImport: {
            /** Format: date-time */
            availableAtUtc?: string | null;
            /** Format: uuid */
            documentId?: string | null;
            metric?: string | null;
            period?: string | null;
            periodEndDate?: string | null;
            publishedDate?: string | null;
            source?: string | null;
            sourceLocation?: string | null;
            sourceUrl?: string | null;
            unavailableReason?: string | null;
            unit?: string | null;
            /** Format: double */
            value?: number | null;
        };
        EquityFundamentalsCoverageGap: {
            /** Format: int64 */
            attemptId?: number | null;
            consolidation?: string | null;
            /** Format: uuid */
            documentId?: string | null;
            metricGroup?: string | null;
            missingMetrics?: string[] | null;
            period?: string | null;
            periodKind?: string | null;
            reason?: string | null;
            source?: string | null;
            stage?: string | null;
        };
        EquityFundamentalsCoverageResponse: {
            /** Format: date-time */
            asOfUtc?: string;
            catalog?: components["schemas"]["EquityCoverageCatalogInfo"];
            cells?: components["schemas"]["EquityCoverageCell"][] | null;
            contractVersion?: string | null;
            firstPeriod?: string | null;
            lastPeriod?: string | null;
            rules?: string[] | null;
            summary?: components["schemas"]["EquityCoverageSummary"];
            symbol?: string | null;
        };
        EquityFundamentalsCoverageSection: {
            catalog?: components["schemas"]["EquityCoverageCatalogInfo"];
            firstPeriod?: string | null;
            /** Format: int32 */
            gapCount?: number;
            gaps?: components["schemas"]["EquityFundamentalsCoverageGap"][] | null;
            gapsTruncated?: boolean;
            lastPeriod?: string | null;
            rules?: string[] | null;
            summary?: components["schemas"]["EquityCoverageSummary"];
        };
        EquityFundamentalsSection: {
            items?: components["schemas"]["EquityFundamentalDto"][] | null;
            reason?: string | null;
            status?: string | null;
        };
        EquityFundamentalsSeriesMetric: {
            metricCode?: string | null;
            metricGroup?: string | null;
            points?: components["schemas"]["EquityFundamentalsSeriesPoint"][] | null;
        };
        EquityFundamentalsSeriesPoint: {
            /** Format: date-time */
            availableAtUtc?: string | null;
            columnRole?: string | null;
            consolidation?: string | null;
            /** Format: uuid */
            documentId?: string;
            factKey?: string | null;
            isDerived?: boolean;
            /** Format: double */
            normalizedValue?: number | null;
            /** Format: int32 */
            page?: number | null;
            period?: string | null;
            periodEnd?: string | null;
            periodType?: string | null;
            /** Format: double */
            scale?: number | null;
            selection?: string | null;
            sourcePeriodType?: string | null;
            supersededBy?: string[] | null;
            supersededFactKey?: string | null;
            supersessionReason?: string | null;
            unit?: string | null;
            /** Format: double */
            value?: number;
        };
        EquityFundamentalsSeriesSection: {
            /** Format: int32 */
            duplicatesDropped?: number;
            /** Format: int32 */
            factCount?: number;
            metrics?: components["schemas"]["EquityFundamentalsSeriesMetric"][] | null;
            reason?: string | null;
            rules?: string[] | null;
            status?: string | null;
        };
        EquityImportReport: {
            /** Format: int32 */
            inserted?: number;
            kind?: string | null;
            symbol?: string | null;
            /** Format: int32 */
            updated?: number;
        };
        EquityIngestionStatusDto: {
            /** Format: int32 */
            attempts?: number;
            detail?: string | null;
            /** Format: date-time */
            lastAttemptAtUtc?: string | null;
            /** Format: date-time */
            lastCompletedAtUtc?: string | null;
            /** Format: int32 */
            maxAttempts?: number;
            /** Format: int64 */
            sessionOpenTimeMs?: number | null;
            status?: string | null;
            timeframes?: components["schemas"]["EquityTimeframeFreshnessDto"][] | null;
        };
        EquityInstrumentDto: {
            activeTimeframes?: string[] | null;
            assetClass?: string | null;
            capabilities?: components["schemas"]["EquityCapabilitiesDto"];
            crossCheckDataProvider?: string | null;
            currency?: string | null;
            dataProvider?: string | null;
            defaultTimeframe?: string | null;
            ingestion?: components["schemas"]["EquityIngestionStatusDto"];
            label?: string | null;
            priceBasis?: string | null;
            symbol?: string | null;
            venue?: string | null;
        };
        EquityInstrumentListResponse: {
            contractVersion?: string | null;
            /** Format: date-time */
            generatedAtUtc?: string;
            items?: components["schemas"]["EquityInstrumentDto"][] | null;
            workerActive?: boolean;
        };
        EquityLlmRunDto: {
            /** Format: date-time */
            createdAtUtc?: string;
            /** Format: int64 */
            durationMs?: number;
            judgeModel?: string | null;
            output?: unknown;
            promptVersion?: string | null;
            reason?: string | null;
            researchModel?: string | null;
            /** Format: uuid */
            runId?: string;
            schemaVersion?: string | null;
            /** Format: int64 */
            signalBarOpenTimeMs?: number;
            status?: string | null;
            symbol?: string | null;
        };
        EquityLlmRunErrorEnvelope: {
            code?: string | null;
            item?: components["schemas"]["EquityLlmRunDto"];
            message?: string | null;
            requestId?: string | null;
            retryable?: boolean;
        };
        EquityLlmRunListResponse: {
            items?: components["schemas"]["EquityLlmRunDto"][] | null;
        };
        EquityPipelineRunDto: {
            checkpoint?: unknown;
            counts?: unknown;
            error?: string | null;
            extractScope?: string | null;
            /** Format: date-time */
            finishedAtUtc?: string | null;
            /** Format: date-time */
            heartbeatAtUtc?: string;
            logTail?: string | null;
            mode?: string | null;
            /** Format: uuid */
            runId?: string;
            /** Format: date-time */
            startedAtUtc?: string;
            status?: string | null;
            supervisedByThisProcess?: boolean;
            symbol?: string | null;
            trigger?: string | null;
        };
        EquityPipelineRunListResponse: {
            contractVersion?: string | null;
            items?: components["schemas"]["EquityPipelineRunDto"][] | null;
            symbol?: string | null;
        };
        EquityReadinessCheck: {
            detail?: string | null;
            name?: string | null;
            status?: string | null;
        };
        EquityReadinessPurpose: {
            checks?: components["schemas"]["EquityReadinessCheck"][] | null;
            reasons?: string[] | null;
            status?: string | null;
        };
        EquityRelativeStrengthSection: {
            benchmarks?: components["schemas"]["EquityRsBenchmarkDto"][] | null;
            reason?: string | null;
            status?: string | null;
            windows?: number[] | null;
        };
        EquityResearchNoteDto: {
            actionBasis?: string | null;
            actionView?: string | null;
            /** Format: int64 */
            availableTimeMs?: number;
            body?: unknown;
            /** Format: date-time */
            createdAtUtc?: string;
            direction?: string | null;
            forecastIds?: string[] | null;
            /** Format: int32 */
            horizonSessions?: number;
            methodVersion?: string | null;
            mode?: string | null;
            noteId?: string | null;
            /** Format: date-time */
            requestedAsOfUtc?: string;
            /** Format: int64 */
            signalBarCloseTimeMs?: number;
            /** Format: int64 */
            signalBarOpenTimeMs?: number;
            skillVersion?: string | null;
            snapshotId?: string | null;
            snapshotSha256?: string | null;
            snapshotVerified?: boolean;
            symbol?: string | null;
        };
        EquityResearchNoteListResponse: {
            contractVersion?: string | null;
            items?: components["schemas"]["EquityResearchNoteDto"][] | null;
            symbol?: string | null;
        };
        EquityResearchNoteRequest: {
            actionBasis?: string | null;
            actionView?: string | null;
            body?: unknown;
            direction?: string | null;
            /** Format: int32 */
            horizonSessions?: number | null;
            methodVersion?: string | null;
            mode?: string | null;
            requestedAsOf?: string | null;
            /** Format: int64 */
            signalBarOpenTimeMs?: number | null;
            skillVersion?: string | null;
            snapshotId?: string | null;
            snapshotSha256?: string | null;
        };
        EquityResearchReadiness: {
            asOfIsLatest?: boolean;
            contractVersion?: string | null;
            /** Format: int64 */
            effectiveCutoffMs?: number;
            purposes?: {
                [key: string]: components["schemas"]["EquityReadinessPurpose"];
            } | null;
            /** Format: date-time */
            requestedAsOf?: string;
            snapshotId?: string | null;
            snapshotSha256?: string | null;
            symbol?: string | null;
        };
        EquityResearchSnapshot: {
            asOfIsLatest?: boolean;
            baseRates?: components["schemas"]["EquityBaseRatesResponse"];
            calendar?: components["schemas"]["EquitySnapshotCalendar"];
            conditions?: components["schemas"]["EquitySnapshotConditions"];
            contextLimitations?: string[] | null;
            contractVersion?: string | null;
            corporateActions?: components["schemas"]["EquityCorporateActionsSection"];
            coverage?: components["schemas"]["EquitySnapshotCoverageDto"][] | null;
            dataset?: {
                [key: string]: components["schemas"]["EquitySnapshotDatasetDto"];
            } | null;
            /** Format: int64 */
            effectiveCutoffMs?: number;
            events?: components["schemas"]["EquityEventsSection"];
            fundamentals?: components["schemas"]["EquityFundamentalsSection"];
            fundamentalsCoverage?: components["schemas"]["EquityFundamentalsCoverageSection"];
            fundamentalsSeries?: components["schemas"]["EquityFundamentalsSeriesSection"];
            /** Format: date-time */
            generatedAt?: string;
            howToGoDeeper?: string[] | null;
            /** Format: int64 */
            latestExpectedOpenTimeMsAtAsOf?: number | null;
            methodVersion?: string | null;
            pit?: components["schemas"]["EquitySnapshotPit"];
            priceBasis?: string | null;
            provider?: string | null;
            relativeStrength?: components["schemas"]["EquityRelativeStrengthSection"];
            /** Format: date-time */
            requestedAsOf?: string;
            /** Format: int64 */
            requestedAsOfMs?: number;
            series?: components["schemas"]["EquitySnapshotSeriesDto"][] | null;
            signalBar?: components["schemas"]["EquitySnapshotBarDto"];
            snapshotId?: string | null;
            snapshotSha256?: string | null;
            sourceDocuments?: components["schemas"]["EquitySourceDocumentRefDto"][] | null;
            symbol?: string | null;
            unavailable?: components["schemas"]["EquitySnapshotUnavailable"][] | null;
        };
        EquityRsBenchmarkDto: {
            /** Format: int32 */
            alignedSessions?: number;
            /** Format: int64 */
            benchmarkLatestOpenTimeMs?: number | null;
            /** Format: int64 */
            instrumentLatestOpenTimeMs?: number | null;
            kind?: string | null;
            /** Format: int32 */
            lagSessions?: number | null;
            /** Format: int64 */
            lastAlignedOpenTimeMs?: number | null;
            reason?: string | null;
            returns?: {
                [key: string]: components["schemas"]["EquityRsWindowDto"];
            } | null;
            status?: string | null;
            symbol?: string | null;
        };
        EquityRsWindowDto: {
            /** Format: double */
            benchmark?: number;
            /** Format: double */
            excess?: number;
            /** Format: double */
            instrument?: number;
        };
        EquitySnapshotBarDto: {
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
            volume?: number;
        };
        EquitySnapshotCalendar: {
            barsBeforeCoverage?: {
                [key: string]: number;
            } | null;
            /** Format: int32 */
            count?: number;
            coverageFrom?: string | null;
            coverageTo?: string | null;
            firstDate?: string | null;
            lastDate?: string | null;
            matchesInMemoryCalendar?: boolean | null;
            nextSessionCheckDate?: string | null;
            reason?: string | null;
            sha256?: string | null;
            source?: string | null;
            status?: string | null;
            /** Format: int32 */
            unverifiedLegacyCount?: number;
            usedFor?: string | null;
            venue?: string | null;
            /** Format: int32 */
            verifiedCount?: number;
            versions?: string[] | null;
        };
        EquitySnapshotConditions: {
            payload?: {
                [key: string]: components["schemas"]["JsonNode"];
            } | null;
            reason?: string | null;
            status?: string | null;
        };
        EquitySnapshotCoverageDto: {
            /** Format: int64 */
            barCount?: number;
            /** Format: int64 */
            expectedBars?: number;
            /** Format: int64 */
            lastStoredOpenTimeMs?: number | null;
            /** Format: int64 */
            latestExpectedOpenTimeMs?: number | null;
            /** Format: int64 */
            missingBars?: number;
            /** Format: int64 */
            recentExpectedBars?: number;
            /** Format: int64 */
            recentMissingBars?: number;
            timeframe?: string | null;
            topGaps?: components["schemas"]["CandleGapRange"][] | null;
            /** Format: int64 */
            unexpectedSessionBars?: number;
            upToDate?: boolean;
        };
        EquitySnapshotDatasetDto: {
            /** Format: int64 */
            barCount?: number;
            fingerprintMethod?: string | null;
            /** Format: int64 */
            firstOpenTimeMs?: number | null;
            /** Format: int64 */
            lastOpenTimeMs?: number | null;
            maxUpdatedAtUtc?: string | null;
            sha256?: string | null;
        };
        EquitySnapshotPit: {
            barsUpdatedAfterAsOf?: {
                [key: string]: number;
            } | null;
            limitations?: string[] | null;
            priceBasis?: string | null;
            reconstruction?: string | null;
        };
        EquitySnapshotSeriesDto: {
            /** Format: int64 */
            barCount?: number;
            endpoint?: string | null;
            /** Format: int64 */
            endTimeMs?: number;
            fingerprint?: string | null;
            fingerprintMethod?: string | null;
            /** Format: int32 */
            pageLimit?: number;
            timeframe?: string | null;
        };
        EquitySnapshotUnavailable: {
            reason?: string | null;
            section?: string | null;
        };
        EquitySourceDocumentDto: {
            auditStatus?: string | null;
            availabilityBasis?: string | null;
            /** Format: date-time */
            availableAtUtc?: string;
            /** Format: int64 */
            byteSize?: number;
            consolidation?: string | null;
            contentSha256?: string | null;
            /** Format: date-time */
            createdAtUtc?: string;
            docType?: string | null;
            /** Format: uuid */
            documentId?: string;
            entity?: string | null;
            /** Format: int32 */
            extractedMetricCount?: number;
            extraction?: unknown;
            /** Format: date-time */
            fetchedAtUtc?: string;
            /** Format: date-time */
            firstSeenAtUtc?: string;
            hasExtraction?: boolean;
            mimeType?: string | null;
            provider?: string | null;
            /** Format: date-time */
            publishedAtUtc?: string | null;
            reportingPeriod?: string | null;
            /** Format: int32 */
            revision?: number;
            sourceUrl?: string | null;
            storagePath?: string | null;
            /** Format: uuid */
            supersedesDocumentId?: string | null;
            symbol?: string | null;
            title?: string | null;
        };
        EquitySourceDocumentListResponse: {
            contractVersion?: string | null;
            items?: components["schemas"]["EquitySourceDocumentDto"][] | null;
            symbol?: string | null;
        };
        EquitySourceDocumentRefDto: {
            auditStatus?: string | null;
            availabilityBasis?: string | null;
            /** Format: date-time */
            availableAtUtc?: string;
            consolidation?: string | null;
            contentSha256?: string | null;
            docType?: string | null;
            /** Format: uuid */
            documentId?: string;
            /** Format: int32 */
            extractedMetricCount?: number;
            extraction?: components["schemas"]["EquityDocumentExtractionStatusDto"];
            extractionRecorded?: boolean;
            /** Format: date-time */
            firstSeenAtUtc?: string;
            hasExtraction?: boolean;
            provider?: string | null;
            /** Format: date-time */
            publishedAtUtc?: string | null;
            reportingPeriod?: string | null;
            /** Format: int32 */
            revision?: number;
            sourceUrl?: string | null;
            /** Format: uuid */
            supersedesDocumentId?: string | null;
            title?: string | null;
        };
        EquitySourceDocumentRegistration: {
            auditStatus?: string | null;
            consolidation?: string | null;
            contentSha256?: string | null;
            docType?: string | null;
            entity?: string | null;
            extraction?: unknown;
            /** Format: date-time */
            fetchedAtUtc?: string | null;
            /** Format: date-time */
            firstSeenAtUtc?: string | null;
            mimeType?: string | null;
            provider?: string | null;
            /** Format: date-time */
            publishedAtUtc?: string | null;
            publishedDate?: string | null;
            reportingPeriod?: string | null;
            sourceUrl?: string | null;
            storagePath?: string | null;
            /** Format: uuid */
            supersedesDocumentId?: string | null;
            title?: string | null;
        };
        EquitySourceDocumentRegistrationResult: {
            created?: boolean;
            item?: components["schemas"]["EquitySourceDocumentDto"];
            publishedAtFilled?: boolean;
        };
        EquityTimeframeFreshnessDto: {
            /** Format: int64 */
            barCount?: number;
            /** Format: int64 */
            latestExpectedFinalizedOpenTimeMs?: number | null;
            /** Format: int64 */
            latestStoredOpenTimeMs?: number | null;
            timeframe?: string | null;
            upToDate?: boolean;
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
        FibonacciLevelDto: {
            /** Format: double */
            price?: number;
            /** Format: double */
            ratio?: number;
        };
        FibonacciReplayDto: {
            /** Format: int64 */
            anchorEndTimeMs?: number;
            /** Format: double */
            anchorHigh?: number;
            /** Format: double */
            anchorLow?: number;
            /** Format: int64 */
            anchorStartTimeMs?: number;
            /** Format: int64 */
            availableTimeMs?: number;
            direction?: string | null;
            eventType?: string | null;
            levels?: components["schemas"]["FibonacciLevelDto"][] | null;
        };
        FibonacciReplayDtoTechnicalLayerEnvelopeDto: {
            availability?: string | null;
            layerKey?: string | null;
            limitations?: string[] | null;
            lineage?: components["schemas"]["TechnicalLayerLineageDto"];
            payload?: components["schemas"]["FibonacciReplayDto"];
            unavailableReason?: string | null;
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
        InstrumentCapabilities: {
            decision?: boolean;
            execution?: boolean;
            futures?: boolean;
            ingestion?: boolean;
            liquidation?: boolean;
            news?: boolean;
            orderBook?: boolean;
            paperTrading?: boolean;
            sentiment?: boolean;
            technicalAnalysis?: boolean;
        };
        InstrumentDescriptor: {
            activeTimeframes: string[];
            aliases: string[];
            assetClass: string;
            capabilities: components["schemas"]["InstrumentCapabilities"];
            crossCheckDataProvider?: string | null;
            currency: string;
            dataProvider: string;
            defaultTimeframe: string;
            enabled?: boolean;
            label: string;
            priceBasis: string;
            symbol: string;
            timezone: string;
            venue: string;
        };
        InstrumentsResponse: {
            contractVersion: string;
            /** Format: date-time */
            generatedAtUtc: string;
            items: components["schemas"]["InstrumentDescriptor"][];
        };
        JsonNode: {
            options?: components["schemas"]["JsonNodeOptions"];
            parent?: components["schemas"]["JsonNode"];
            root?: components["schemas"]["JsonNode"];
        };
        JsonNodeOptions: {
            propertyNameCaseInsensitive?: boolean;
        };
        KlineDataIssueDto: {
            /** Format: int64 */
            actualDurationMs?: number | null;
            /** Format: int64 */
            affectedBars?: number;
            affectedDownstreamArtifacts: string[];
            causeCode: string;
            /** Format: int64 */
            endOpenTimeMs?: number;
            evidence: components["schemas"]["KlineIssueEvidenceDto"];
            /** Format: int64 */
            expectedDurationMs?: number;
            /** Format: date-time */
            firstDetectedAtUtc?: string | null;
            issueKey: string;
            issueType: string;
            repairable?: boolean;
            resolutionState: string;
            /** Format: int64 */
            startOpenTimeMs?: number;
            symbol: string;
            timeframe: string;
            /** Format: date-time */
            updatedAtUtc?: string | null;
        };
        KlineDataIssuesResponse: {
            /** Format: int64 */
            auditEndOpenTimeMs?: number;
            /** Format: date-time */
            generatedAtUtc?: string;
            issues: components["schemas"]["KlineDataIssueDto"][];
            limitations: string[];
            recentRepairs: components["schemas"]["KlineRepairAuditDto"][];
            symbol: string;
            taxonomyVersion: string;
            timeframe: string;
            /** Format: int64 */
            totalKnownIssues?: number;
            truncated?: boolean;
        };
        KlineDataRepairRequest: {
            dryRun?: boolean;
            /** Format: int64 */
            endOpenTimeMs?: number;
            expectedPlanSha256?: string | null;
            issueType: string;
            /** Format: int64 */
            startOpenTimeMs?: number;
            symbol?: string | null;
            timeframe?: string | null;
        };
        KlineDataRepairResponse: {
            affectedDownstreamArtifacts: string[];
            alreadyApplied?: boolean;
            applied?: boolean;
            derivedRebuildRequired?: boolean;
            dryRun?: boolean;
            /** Format: int64 */
            endOpenTimeMs?: number;
            /** Format: int32 */
            insertedBars?: number;
            issueType: string;
            limitations: string[];
            /** Format: int32 */
            noopBars?: number;
            planSha256: string;
            /** Format: int64 */
            repairAuditId?: number | null;
            /** Format: int32 */
            replacedBars?: number;
            /** Format: int32 */
            requestedBars?: number;
            /** Format: date-time */
            sourceCheckedAtUtc?: string;
            sourceClassification: string;
            sourceEndpoint: string;
            sourceEvidenceSha256: string;
            /** Format: int32 */
            sourceRows?: number;
            /** Format: int64 */
            startOpenTimeMs?: number;
            symbol: string;
            taxonomyVersion: string;
            timeframe: string;
            unresolvedOpenTimeMs: number[];
            /** Format: int32 */
            verifiedSourceBars?: number;
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
        KlineIssueEvidenceDto: {
            authoritativeRepairSource: string;
            detail?: string | null;
            detectionMethod: string;
            /** Format: date-time */
            lastSourceAttemptAtUtc?: string | null;
            /** Format: date-time */
            nextSourceRetryAtUtc?: string | null;
            /** Format: int32 */
            sourceAttemptCount?: number;
            sourceClassification: string;
        };
        KlineQualityAudit: {
            /** Format: int64 */
            duplicateOpenTimeRows?: number;
            /** Format: int64 */
            finalizedRows?: number;
            /** Format: int64 */
            formingRows?: number;
            /** Format: int64 */
            invalidDurationRows?: number;
            /** Format: int64 */
            invalidOhlcvRows?: number;
            isStale?: boolean;
            /** Format: int64 */
            latestFinalizedAgeSeconds?: number | null;
            /** Format: int64 */
            latestFinalizedCloseTimeMs?: number | null;
        };
        KlineRepairAuditDto: {
            /** Format: date-time */
            appliedAtUtc?: string;
            /** Format: int64 */
            endOpenTimeMs?: number;
            /** Format: int64 */
            id?: number;
            /** Format: int32 */
            insertedBars?: number;
            issueType: string;
            /** Format: int32 */
            noopBars?: number;
            planSha256: string;
            /** Format: int32 */
            replacedBars?: number;
            /** Format: int32 */
            requestedBars?: number;
            /** Format: date-time */
            sourceCheckedAtUtc?: string;
            sourceClassification: string;
            sourceEvidenceSha256: string;
            /** Format: int64 */
            startOpenTimeMs?: number;
            /** Format: int32 */
            unresolvedBars?: number;
            /** Format: int32 */
            verifiedSourceBars?: number;
        };
        MarketCalendarDayDto: {
            date?: string | null;
            kind?: string | null;
            reason?: string | null;
            sourceTitle?: string | null;
            sourceUrl?: string | null;
            verification?: string | null;
        };
        MarketCalendarResponse: {
            calendarVersion?: string | null;
            configOverrideDates?: string[] | null;
            contractVersion?: string | null;
            coverageFromDate?: string | null;
            coverageToDate?: string | null;
            databaseSync?: components["schemas"]["MarketCalendarSyncDto"];
            days?: components["schemas"]["MarketCalendarDayDto"][] | null;
            /** Format: date-time */
            generatedAtUtc?: string;
            limitations?: string[] | null;
            /** Format: int32 */
            unverifiedLegacyDays?: number;
            venue?: string | null;
            /** Format: int32 */
            verifiedDays?: number;
        };
        MarketCalendarSyncDto: {
            /** Format: date-time */
            atUtc?: string;
            /** Format: int32 */
            deleted?: number;
            error?: string | null;
            /** Format: int32 */
            inserted?: number;
            status?: string | null;
            /** Format: int32 */
            unchanged?: number;
            /** Format: int32 */
            updated?: number;
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
        MarketRegimeReplayDto: {
            /** Format: int64 */
            availableTimeMs?: number;
            /** Format: double */
            currentTrueRangePct?: number;
            /** Format: int32 */
            downChanges?: number;
            eventType?: string | null;
            /** Format: int64 */
            openTimeMs?: number;
            /** Format: double */
            priorMedianTrueRangePct?: number;
            /** Format: double */
            rangeRatio?: number;
            regimeType?: string | null;
            trend?: string | null;
            /** Format: int32 */
            upChanges?: number;
            volatility?: string | null;
        };
        MarketRegimeReplayDtoTechnicalLayerEnvelopeDto: {
            availability?: string | null;
            layerKey?: string | null;
            limitations?: string[] | null;
            lineage?: components["schemas"]["TechnicalLayerLineageDto"];
            payload?: components["schemas"]["MarketRegimeReplayDto"];
            unavailableReason?: string | null;
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
        MbbBuyMoreCapacity: {
            /** Format: double */
            estimatedCostVnd: number;
            /** Format: int32 */
            maxBuyableLots: number;
            /** Format: int32 */
            maxBuyableShares: number;
        };
        MbbCalendarInfo: {
            calendarVersion?: string | null;
            configOverrideDates?: string[] | null;
            coverageFromDate?: string | null;
            coverageToDate?: string | null;
            peerSymbols?: string[] | null;
            source?: string | null;
            /** Format: int32 */
            unverifiedLegacyDays?: number;
            /** Format: int32 */
            verifiedDays?: number;
        };
        MbbCandleDto: {
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
            quoteVolume?: number | null;
            /** Format: double */
            takerBuyQuoteVolume?: number | null;
            /** Format: double */
            takerBuyVolume?: number | null;
            timeIso?: string | null;
            /** Format: int32 */
            tradeCount?: number | null;
            /** Format: double */
            volume?: number;
        };
        MbbCashContext: {
            /** Format: double */
            buyBudgetVnd?: number | null;
            cashSource: string;
            /** Format: double */
            sharedCashVnd?: number | null;
            /** Format: double */
            spendableVnd?: number | null;
            /** Format: double */
            totalDeclaredBudgetsVnd: number;
        };
        MbbClassifiedGapRange: {
            classification?: string | null;
            /** Format: int64 */
            endOpenTimeMs?: number;
            /** Format: int64 */
            missingBars?: number;
            /** Format: int64 */
            startOpenTimeMs?: number;
        };
        MbbCorporateActionApplication: {
            actionType: string;
            /** Format: int32 */
            affectedLots: number;
            exDate: string;
            reason?: string | null;
            /** Format: double */
            shareRatio?: number | null;
            status: string;
            verificationStatus: string;
        };
        MbbCoverageReport: {
            calendar?: components["schemas"]["MbbCalendarInfo"];
            crossCheckProvider?: string | null;
            /** Format: date-time */
            generatedAtUtc?: string;
            limitations?: string[] | null;
            priceBasis?: string | null;
            provider?: string | null;
            sourceTimezone?: string | null;
            symbol?: string | null;
            timeframes?: components["schemas"]["MbbTimeframeCoverage"][] | null;
            venue?: string | null;
        };
        MbbDecisionDto: {
            action: string;
            buyMore?: components["schemas"]["MbbBuyMoreCapacity"];
            cash?: components["schemas"]["MbbCashContext"];
            dataFreshness: components["schemas"]["MbbTimeframeFreshness"][];
            evidenceStatus: string;
            /** Format: date-time */
            generatedAtUtc: string;
            invalidation?: string | null;
            market: components["schemas"]["MbbMarketContext"];
            position: components["schemas"]["MbbPositionSummary"];
            priceBasis: string;
            reasons: string[];
            symbol: string;
            triggers: components["schemas"]["MbbDecisionTrigger"][];
        };
        MbbDecisionTrigger: {
            condition: string;
            direction?: string | null;
            name: string;
            nonFillRisk?: string | null;
            /** Format: double */
            priceLevelVnd?: number | null;
            timeframe: string;
            withinPriceBand?: boolean | null;
        };
        MbbMarketContext: {
            /** Format: double */
            atr14?: number | null;
            /** Format: double */
            ceilingPriceVnd?: number | null;
            /** Format: double */
            ema50?: number | null;
            /** Format: double */
            floorPriceVnd?: number | null;
            /** Format: double */
            lastDailyCloseVnd?: number | null;
            /** Format: double */
            latestHourlyCloseVnd?: number | null;
            /** Format: double */
            previousDailyCloseVnd?: number | null;
            /** Format: double */
            rsi14?: number | null;
            rsiZone: string;
            /** Format: double */
            sma50?: number | null;
            trend: string;
        };
        MbbObservationDto: {
            decision?: string | null;
            decisionId?: string | null;
            evidenceStatus?: string | null;
            /** Format: int64 */
            fillBarOpenTimeMs?: number | null;
            /** Format: date-time */
            fillObservedAtUtc?: string | null;
            /** Format: double */
            fillPrice?: number | null;
            fillSource?: string | null;
            /** Format: double */
            marketCloseVnd?: number | null;
            /** Format: date-time */
            observedAtUtc?: string;
            outcomeHorizon?: string | null;
            /** Format: date-time */
            outcomeObservedAtUtc?: string | null;
            /** Format: double */
            outcomeReturn?: number | null;
            priceBasis?: string | null;
            recorderVersion?: string | null;
            /** Format: int64 */
            signalBarCloseTimeMs?: number;
            /** Format: int64 */
            signalBarOpenTimeMs?: number;
            symbol?: string | null;
            timeframe?: string | null;
        };
        MbbPositionDto: {
            /** Format: double */
            availableCashVnd: number;
            /** Format: double */
            avgCostPerShareVnd?: number | null;
            /** Format: double */
            buyBudgetVnd?: number | null;
            cashNotes?: string[] | null;
            cashSource?: string | null;
            lots: components["schemas"]["MbbPositionLotDto"][];
            /** Format: int32 */
            pendingShares: number;
            /** Format: int32 */
            settledShares: number;
            /** Format: double */
            sharedCashVnd?: number | null;
            symbol: string;
            /** Format: double */
            totalDeclaredBudgetsVnd?: number | null;
            /** Format: int32 */
            totalShares: number;
            /** Format: date-time */
            updatedAtUtc?: string | null;
        };
        MbbPositionLotDto: {
            acquireDate: string;
            /** Format: double */
            costPerShareVnd: number;
            /** Format: int64 */
            id: number;
            /** Format: int32 */
            quantity: number;
            settled: boolean;
            settleDate: string;
            source: string;
        };
        MbbPositionSummary: {
            /** Format: double */
            avgCostPerShareVnd?: number | null;
            corporateActions?: components["schemas"]["MbbCorporateActionApplication"][] | null;
            costBasisComparable?: boolean;
            costBasisNote?: string | null;
            /** Format: double */
            lastPriceVnd?: number | null;
            /** Format: double */
            netProceedsIfSellableNowVnd?: number | null;
            /** Format: int32 */
            pendingShares: number;
            /** Format: int32 */
            sellableSharesNow: number;
            /** Format: int32 */
            settledShares: number;
            /** Format: int32 */
            totalShares: number;
            /** Format: double */
            unrealizedPnlPct?: number | null;
            /** Format: double */
            unrealizedPnlVnd?: number | null;
        };
        MbbRecomputeModuleResult: {
            detail?: string | null;
            module?: string | null;
            /** Format: int32 */
            rowsWritten?: number;
            status?: string | null;
        };
        MbbSyncReport: {
            /** Format: date-time */
            generatedAtUtc?: string;
            status?: string | null;
            symbol?: string | null;
            timeframes?: components["schemas"]["MbbTimeframeSync"][] | null;
        };
        MbbTechnicalRecomputeReport: {
            /** Format: int32 */
            candleCount?: number;
            /** Format: date-time */
            generatedAtUtc?: string;
            modules?: components["schemas"]["MbbRecomputeModuleResult"][] | null;
            status?: string | null;
            symbol?: string | null;
            timeframe?: string | null;
        };
        MbbTimeframeCoverage: {
            /** Format: int64 */
            belowCalendarCoverageMissingBars?: number;
            /** Format: int64 */
            calendarCoverageExpiredMissingBars?: number;
            calendarFlags?: string[] | null;
            /** Format: double */
            coveragePct?: number;
            /** Format: int64 */
            expectedBars?: number;
            /** Format: date-time */
            firstOpenUtc?: string | null;
            freshnessReason?: string | null;
            /** Format: int64 */
            gapRangeCount?: number;
            /** Format: int64 */
            invalidOhlcvRows?: number;
            isStale?: boolean;
            /** Format: date-time */
            lastOpenUtc?: string | null;
            /** Format: int64 */
            latestBarAgeSeconds?: number | null;
            /** Format: date-time */
            latestExpectedFinalizedOpenUtc?: string | null;
            /** Format: int64 */
            marketWideMissingBars?: number;
            /** Format: int64 */
            missingBars?: number;
            /** Format: int64 */
            noPeerDataMissingBars?: number;
            /** Format: int64 */
            symbolMissingBars?: number;
            timeframe?: string | null;
            topClassifiedGaps?: components["schemas"]["MbbClassifiedGapRange"][] | null;
            topGaps?: components["schemas"]["CandleGapRange"][] | null;
            /** Format: int64 */
            totalBars?: number;
            /** Format: int64 */
            unexpectedSessionBars?: number;
            unexpectedSessionOpenTimeMs?: number[] | null;
            /** Format: int64 */
            unverifiedNonTradingDaysInRange?: number;
        };
        MbbTimeframeFreshness: {
            isStale: boolean;
            /** Format: int64 */
            latestExpectedFinalizedOpenMs?: number | null;
            /** Format: int64 */
            latestOpenTimeMs?: number | null;
            reason?: string | null;
            timeframe: string;
        };
        MbbTimeframeSync: {
            error?: string | null;
            /** Format: int32 */
            fetchedBars?: number;
            /** Format: int32 */
            fetchedRequests?: number;
            /** Format: int32 */
            gapRangesProcessed?: number;
            /** Format: int32 */
            gapRangesRemaining?: number;
            /** Format: int32 */
            insertedBars?: number;
            /** Format: int64 */
            missingExpectedBars?: number;
            /** Format: int32 */
            rejectedInvalidBars?: number;
            /** Format: int32 */
            revisionRefetchRequests?: number;
            revisionRefetchStatus?: string | null;
            /** Format: int32 */
            skippedFormingBars?: number;
            timeframe?: string | null;
            /** Format: int32 */
            updatedBars?: number;
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
        ObserveReport: {
            decision?: string | null;
            decisionId?: string | null;
            detail?: string | null;
            /** Format: int32 */
            fillsResolved?: number;
            /** Format: int32 */
            forecastOutcomesResolved?: number | null;
            /** Format: int32 */
            outcomesResolved?: number;
            /** Format: int64 */
            signalBarOpenTimeMs?: number | null;
            status?: string | null;
            symbol?: string | null;
            timeframe?: string | null;
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
            pipeline?: components["schemas"]["ResearchEvidencePipelineStatusDto"];
            pipelines?: components["schemas"]["ResearchEvidencePipelineStatusDto"][] | null;
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
            eventTypeDetail?: unknown;
            evidenceProfiles?: unknown;
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
            reportExclusions?: unknown;
            reportSha256: string;
            sensitivityAudit?: unknown;
            statisticalEvidence?: unknown;
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
        ResearchEvidencePipelineStatusDto: {
            integrityVerified?: boolean;
            lastError?: string | null;
            /** Format: date-time */
            lastFailedAtUtc?: string | null;
            /** Format: date-time */
            lastStartedAtUtc?: string | null;
            /** Format: date-time */
            lastSucceededAtUtc?: string | null;
            locked?: boolean;
            running?: boolean;
            /** Format: date-time */
            staleAfterUtc?: string | null;
            state: string;
            symbol: string;
            timeframes: components["schemas"]["ResearchEvidencePipelineTimeframeStatusDto"][];
            /** Format: date-time */
            updatedAtUtc?: string | null;
        };
        ResearchEvidencePipelineTimeframeStatusDto: {
            /** Format: int64 */
            cutoffMs?: number;
            definitionsSha256?: string | null;
            /** Format: int64 */
            eligible?: number;
            /** Format: int64 */
            excluded?: number;
            manifestSha256: string;
            /** Format: int64 */
            realizedAtMaxHorizon?: number;
            semanticVerification?: boolean;
            /** Format: int64 */
            stored?: number;
            timeframe: string;
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
        TechnicalEventEvidenceDto: {
            /** Format: int64 */
            availableTimeMs?: number;
            calculationVersion?: string | null;
            description?: string | null;
            detectionConditions?: string[] | null;
            eventId?: string | null;
            eventType?: string | null;
            /** Format: double */
            highPrice?: number | null;
            /** Format: int64 */
            invalidatedAtMs?: number | null;
            invalidationRule?: string | null;
            limitations?: string[] | null;
            /** Format: double */
            lowPrice?: number | null;
            /** Format: int64 */
            mitigatedAtMs?: number | null;
            mitigationRule?: string | null;
            /** Format: int64 */
            originTimeMs?: number;
            /** Format: double */
            price?: number;
            /** Format: int64 */
            referenceTimeMs?: number | null;
            sourceCandles?: components["schemas"]["TechnicalSourceCandleDto"][] | null;
            stateAtAsOf?: string | null;
        };
        TechnicalEvidenceCoverageResponse: {
            checkpointStatus?: string | null;
            /** Format: int64 */
            coverageStartCloseTimeMs?: number | null;
            historicalBackfill?: boolean;
            /** Format: int64 */
            lastProcessedCloseTimeMs?: number | null;
            moduleContractSha256?: string | null;
            moduleContractVersion?: string | null;
            recordsByLayer?: {
                [key: string]: number;
            } | null;
            /** Format: int64 */
            sparseRecordCount?: number;
            storagePolicy?: string | null;
            symbol?: string | null;
            timeframe?: string | null;
        };
        TechnicalEvidenceRebuildRequest: {
            dryRun?: boolean;
            /** Format: int32 */
            maxCandles?: number;
            symbol?: string | null;
            timeframe?: string | null;
        };
        TechnicalEvidenceRebuildResult: {
            /** Format: int64 */
            batchStartCloseTimeMs?: number | null;
            /** Format: int32 */
            candidateCandles?: number;
            /** Format: int64 */
            coverageStartCloseTimeMs?: number | null;
            dryRun?: boolean;
            /** Format: int64 */
            estimatedEnvelopeBytes?: number;
            /** Format: int32 */
            estimatedSparseRecords?: number;
            /** Format: int32 */
            existingRecords?: number;
            historicalBackfill?: boolean;
            /** Format: int32 */
            insertedRecords?: number;
            /** Format: int64 */
            lastProcessedCloseTimeMs?: number | null;
            limitations?: string[] | null;
            moduleContractSha256?: string | null;
            moduleContractVersion?: string | null;
            /** Format: int64 */
            previousCheckpointCloseTimeMs?: number | null;
            status?: string | null;
            symbol?: string | null;
            timeframe?: string | null;
        };
        TechnicalIndicatorEventDto: {
            /** Format: int32 */
            direction?: number;
            eventType?: string | null;
            /** Format: double */
            value?: number;
        };
        TechnicalIndicatorReplayDto: {
            /** Format: int64 */
            availableTimeMs?: number;
            /** Format: double */
            ema12?: number | null;
            /** Format: double */
            ema26?: number | null;
            events?: components["schemas"]["TechnicalIndicatorEventDto"][] | null;
            /** Format: int64 */
            openTimeMs?: number;
            /** Format: double */
            rsi14?: number | null;
            /** Format: double */
            sma50?: number | null;
        };
        TechnicalIndicatorReplayDtoTechnicalLayerEnvelopeDto: {
            availability?: string | null;
            layerKey?: string | null;
            limitations?: string[] | null;
            lineage?: components["schemas"]["TechnicalLayerLineageDto"];
            payload?: components["schemas"]["TechnicalIndicatorReplayDto"];
            unavailableReason?: string | null;
        };
        TechnicalLayerCoverageDto: {
            availability?: string | null;
            checkpointStatus?: string | null;
            hasGapBoundary?: boolean;
            isEventEnvelopeMaterializedAtAsOf?: boolean;
            /** Format: int64 */
            latestAvailableTimeMs?: number | null;
            layerKey?: string | null;
            /** Format: int32 */
            requiredWarmupBars?: number;
            /** Format: int32 */
            sourceBars?: number;
            storageStatus?: string | null;
        };
        TechnicalLayerLineageDto: {
            /** Format: int64 */
            availableTimeMs?: number | null;
            calculationVersion?: string | null;
            /** Format: int64 */
            effectiveAsOfTimeMs?: number | null;
            evaluationMode?: string | null;
            isCausal?: boolean;
            isPersisted?: boolean;
            moduleContractSha256?: string | null;
            moduleContractVersion?: string | null;
            producer?: string | null;
            /** Format: int64 */
            requestedAsOfTimeMs?: number;
            /** Format: int32 */
            requiredWarmupBars?: number;
            source?: string | null;
            /** Format: int32 */
            sourceCandleCount?: number;
            /** Format: int64 */
            sourceEndTimeMs?: number | null;
            /** Format: int64 */
            sourceStartTimeMs?: number | null;
        };
        TechnicalReplayAdministrationDto: {
            /** Format: int32 */
            contextLimitBars?: number;
            hasGapBoundary?: boolean;
            legacySmartMoneyStatus?: string | null;
            rebuildReason?: string | null;
            rebuildRequired?: boolean;
        };
        TechnicalReplayCandleDto: {
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
            volume?: number;
        };
        TechnicalReplayLayersDto: {
            candlePatterns?: components["schemas"]["CandlePatternReplayDtoTechnicalLayerEnvelopeDto"];
            confluence?: components["schemas"]["ConfluenceReplayDtoTechnicalLayerEnvelopeDto"];
            fibonacci?: components["schemas"]["FibonacciReplayDtoTechnicalLayerEnvelopeDto"];
            indicators?: components["schemas"]["TechnicalIndicatorReplayDtoTechnicalLayerEnvelopeDto"];
            marketRegime?: components["schemas"]["MarketRegimeReplayDtoTechnicalLayerEnvelopeDto"];
            volumeAnomaly?: components["schemas"]["VolumeAnomalyReplayDtoTechnicalLayerEnvelopeDto"];
            volumeProfile?: components["schemas"]["VolumeProfileReplayDtoTechnicalLayerEnvelopeDto"];
        };
        TechnicalReplayProvenanceDto: {
            availabilityRule?: string | null;
            contextRule?: string | null;
            evaluationMode?: string | null;
            persistedByReplay?: boolean;
            source?: string | null;
        };
        TechnicalReplayResponse: {
            administration?: components["schemas"]["TechnicalReplayAdministrationDto"];
            /** Format: int32 */
            analysisCandleCount?: number;
            calculationVersion?: string | null;
            candles?: components["schemas"]["TechnicalReplayCandleDto"][] | null;
            /** Format: int64 */
            contiguousSegmentStartTimeMs?: number | null;
            coverage?: components["schemas"]["TechnicalLayerCoverageDto"][] | null;
            /** Format: int64 */
            effectiveAsOfTimeMs?: number | null;
            events?: components["schemas"]["TechnicalEventEvidenceDto"][] | null;
            /** Format: int64 */
            lastFinalizedCandleCloseTimeMs?: number | null;
            layers?: components["schemas"]["TechnicalReplayLayersDto"];
            limitations?: string[] | null;
            moduleContractSha256?: string | null;
            moduleContractVersion?: string | null;
            provenance?: components["schemas"]["TechnicalReplayProvenanceDto"];
            /** Format: int64 */
            replayWindowStartTimeMs?: number | null;
            /** Format: int64 */
            requestedAsOfTimeMs?: number;
            /** Format: int32 */
            requestedLookbackBars?: number;
            /** Format: int32 */
            sourceCandleCount?: number;
            symbol?: string | null;
            timeframe?: string | null;
        };
        TechnicalSourceCandleDto: {
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
            role?: string | null;
            /** Format: double */
            volume?: number;
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
        UpdateEquityCashRequest: {
            /** Format: double */
            availableCashVnd?: number | null;
        };
        UpdateMbbPositionLotItem: {
            acquireDate: string;
            /** Format: double */
            costPerShareVnd: number;
            /** Format: int32 */
            quantity: number;
        };
        UpdateMbbPositionRequest: {
            /** Format: double */
            availableCashVnd?: number | null;
            /** Format: double */
            buyBudgetVnd?: number | null;
            lots: components["schemas"]["UpdateMbbPositionLotItem"][];
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
        VolumeAnomalyReplayDto: {
            /** Format: int64 */
            availableTimeMs?: number;
            /** Format: int64 */
            openTimeMs?: number;
            triggeredEvents?: string[] | null;
            /** Format: double */
            volume?: number;
            /** Format: double */
            volumeAnomalyRatio?: number;
            /** Format: double */
            volumeSma20?: number;
            volumeTrend?: string | null;
            /** Format: double */
            volumeVsMax10?: number;
            /** Format: double */
            volumeVsPrevious?: number;
        };
        VolumeAnomalyReplayDtoTechnicalLayerEnvelopeDto: {
            availability?: string | null;
            layerKey?: string | null;
            limitations?: string[] | null;
            lineage?: components["schemas"]["TechnicalLayerLineageDto"];
            payload?: components["schemas"]["VolumeAnomalyReplayDto"];
            unavailableReason?: string | null;
        };
        VolumeProfileBinDto: {
            isPoc?: boolean;
            isValueArea?: boolean;
            /** Format: double */
            priceLevel?: number;
            /** Format: double */
            volume?: number;
            /** Format: double */
            volumePct?: number;
        };
        VolumeProfileReplayDto: {
            /** Format: int32 */
            binCount?: number;
            bins?: components["schemas"]["VolumeProfileBinDto"][] | null;
            events?: string[] | null;
            /** Format: double */
            inputVolume?: number;
            method?: string | null;
            /** Format: double */
            pocPrice?: number;
            /** Format: double */
            vahPrice?: number;
            /** Format: double */
            valPrice?: number;
            /** Format: double */
            valueAreaFraction?: number;
            /** Format: int64 */
            windowEndMs?: number;
            /** Format: int64 */
            windowStartMs?: number;
        };
        VolumeProfileReplayDtoTechnicalLayerEnvelopeDto: {
            availability?: string | null;
            layerKey?: string | null;
            limitations?: string[] | null;
            lineage?: components["schemas"]["TechnicalLayerLineageDto"];
            payload?: components["schemas"]["VolumeProfileReplayDto"];
            unavailableReason?: string | null;
        };
        WorkerHealth: {
            /** Format: int64 */
            ageSeconds?: number | null;
            /** Format: int32 */
            attempted?: number | null;
            /** Format: int32 */
            failed?: number | null;
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
            /** Format: int32 */
            remaining?: number | null;
            /** Format: int32 */
            skipped?: number | null;
            status?: string | null;
            /** Format: int32 */
            succeeded?: number | null;
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
