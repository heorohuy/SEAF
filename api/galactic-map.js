import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});


const API_BASE = 'https://api.helldivers2.dev';

/* -------------------------------------------------------------------------- */
/* Cache keys                                                                 */
/* -------------------------------------------------------------------------- */

const PLANETS_KEY = 'seaf:galactic:planets';
const WAR_ID_KEY = 'seaf:galactic:war-id';

const WAR_INFO_KEY = 'seaf:galactic:war-info';

/*
 * Locks prevent multiple Vercel functions from simultaneously
 * refreshing the same expired cache entry.
 */
const PLANETS_LOCK_KEY = 'seaf:galactic:planets:lock';
const WAR_ID_LOCK_KEY = 'seaf:galactic:war-id:lock';

/* -------------------------------------------------------------------------- */
/* Cache configuration                                                        */
/* -------------------------------------------------------------------------- */

/*
 * "Fresh" = normal cache lifetime.
 */
const PLANETS_TTL = 30;
const WAR_ID_TTL = 600;
const WAR_INFO_TTL = 600;

/*
 * "Stale" = how long we keep the old data around so it can still
 * be returned if the Helldivers API is unavailable.
 *
 * These should be LONGER than the normal TTL.
 */
const PLANETS_STALE_TTL = 300;   // 5 minutes
const WAR_ID_STALE_TTL = 3600;   // 1 hour
const WAR_INFO_STALE_TTL = 3600; // 1 hour

/*
 * Redis lock lifetime.
 */
const LOCK_TTL = 15;


/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


/* -------------------------------------------------------------------------- */
/* Helldivers API                                                             */
/* -------------------------------------------------------------------------- */

async function fetchHelldivers(endpoint) {
    const url = `${API_BASE}${endpoint}`;

    let rateLimitRetries = 0;
    let serverRetries = 0;

    while (true) {
        const response = await fetch(url, {
            method: 'GET',

            headers: {
                'X-Super-Client': 'SEAF',
                'X-Super-Contact':
                    'https://github.com/heorohuy/SEAF',
            },

            cache: 'no-store',
        });

        if (response.ok) {
            return response.json();
        }

        /* ---------------------------------------------------------------------- */
        /* 429 Rate Limited                                                       */
        /* ---------------------------------------------------------------------- */

        if (response.status === 429) {
            if (rateLimitRetries >= 2) {
                throw new Error(
                    'Helldivers API rate limit exceeded.',
                );
            }

            rateLimitRetries += 1;

            const retryAfterHeader =
                response.headers.get('Retry-After');

            const retryAfter =
                Number(retryAfterHeader);

            /*
             * If the API tells us how long to wait,
             * respect it.
             *
             * Otherwise use our own backoff.
             */
            const delay =
                Number.isFinite(retryAfter)
                    ? Math.min(
                        retryAfter * 1000,
                        30_000,
                    )
                    : 10_000 * rateLimitRetries;

            console.warn(
                `[SEAF] Helldivers API returned 429. ` +
                `Waiting ${Math.round(delay / 1000)}s.`,
            );

            await sleep(delay);

            continue;
        }

        /* ---------------------------------------------------------------------- */
        /* Temporary 5xx errors                                                   */
        /* ---------------------------------------------------------------------- */

        if (
            [500, 502, 503, 504].includes(
                response.status,
            )
        ) {
            if (serverRetries >= 2) {
                throw new Error(
                    `Helldivers API unavailable (${response.status}).`,
                );
            }

            const delay =
                2000 * (2 ** serverRetries);

            serverRetries += 1;

            console.warn(
                `[SEAF] Helldivers API returned ${response.status}. ` +
                `Retrying in ${delay / 1000}s.`,
            );

            await sleep(delay);

            continue;
        }

        /* ---------------------------------------------------------------------- */
        /* Other errors                                                           */
        /* ---------------------------------------------------------------------- */

        const body = await response.text();

        throw new Error(
            `Helldivers API error ${response.status}: ${body}`,
        );
    }
}


/* -------------------------------------------------------------------------- */
/* Redis                                                                      */
/* -------------------------------------------------------------------------- */

async function getCache(key) {
    try {
        const entry = await redis.get(key);

        if (!entry) {
            return null;
        }

        return entry;
    } catch (error) {
        console.error(
            `[SEAF] Redis GET failed for ${key}:`,
            error,
        );

        /*
         * Redis failure should not be confused with a cache miss.
         */
        throw error;
    }
}


async function setCache(
    key,
    data,
    ttl,
) {
    await redis.set(
        key,
        {
            data,
            cachedAt: Date.now(),
        },
        {
            ex: ttl,
        },
    );
}


/* -------------------------------------------------------------------------- */
/* Locking                                                                    */
/* -------------------------------------------------------------------------- */

async function acquireLock(key) {
    const lockValue =
        `${Date.now()}-${Math.random()}`;

    const acquired =
        await redis.set(
            key,
            lockValue,
            {
                nx: true,
                ex: LOCK_TTL,
            },
        );

    return acquired === 'OK';
}


async function waitForCache(
    key,
    attempts = 5,
) {
    for (let i = 0; i < attempts; i += 1) {
        await sleep(500);

        const cached =
            await getCache(key);

        if (cached) {
            return cached;
        }
    }

    return null;
}


/* -------------------------------------------------------------------------- */
/* Planets                                                                    */
/* -------------------------------------------------------------------------- */

async function getPlanets() {
    const cached =
        await getCache(PLANETS_KEY);

    if (cached) {
        return {
            data: cached.data,
            cached: true,
            cachedAt: cached.cachedAt,
        };
    }

    /*
     * Nobody has the cache.
     *
     * Try to become the process that refreshes it.
     */
    const acquired =
        await acquireLock(
            PLANETS_LOCK_KEY,
        );

    if (!acquired) {
        /*
         * Another Vercel function is already fetching it.
         *
         * Wait for that request to populate Redis.
         */
        const waitingCache =
            await waitForCache(
                PLANETS_KEY,
            );

        if (waitingCache) {
            return {
                data: waitingCache.data,
                cached: true,
                cachedAt: waitingCache.cachedAt,
            };
        }
    }

    /*
     * Re-check Redis after acquiring the lock.
     *
     * Another request may have populated the cache
     * between our first GET and acquiring the lock.
     */
    const existing =
        await getCache(PLANETS_KEY);

    if (existing) {
        return {
            data: existing.data,
            cached: true,
            cachedAt: existing.cachedAt,
        };
    }

    const data =
        await fetchHelldivers(
            '/api/v1/planets',
        );

    await setCache(
        PLANETS_KEY,
        data,
        PLANETS_TTL,
    );


    return {
        data,
        cached: false,
        cachedAt: Date.now(),
    };
}


/* -------------------------------------------------------------------------- */
/* War ID                                                                     */
/* -------------------------------------------------------------------------- */

async function getWarId() {
    const cached =
        await getCache(WAR_ID_KEY);

    if (cached) {
        return {
            data: cached.data,
            cached: true,
            cachedAt: cached.cachedAt,
        };
    }

    const acquired =
        await acquireLock(
            WAR_ID_LOCK_KEY,
        );

    if (!acquired) {
        const waitingCache =
            await waitForCache(
                WAR_ID_KEY,
            );

        if (waitingCache) {
            return {
                data: waitingCache.data,
                cached: true,
                cachedAt: waitingCache.cachedAt,
            };
        }
    }

    const existing =
        await getCache(WAR_ID_KEY);

    if (existing) {
        return {
            data: existing.data,
            cached: true,
            cachedAt: existing.cachedAt,
        };
    }

    const data =
        await fetchHelldivers(
            '/raw/api/WarSeason/current/WarID',
        );

    await setCache(
        WAR_ID_KEY,
        data,
        WAR_ID_TTL,
    );


    return {
        data,
        cached: false,
        cachedAt: Date.now(),
    };
}


/* -------------------------------------------------------------------------- */
/* War Info                                                                   */
/* -------------------------------------------------------------------------- */

async function getWarInfo(warId) {
    /*
     * The war ID is included in the key.
     *
     * When the war changes, the cache automatically points
     * to a completely different entry.
     */
    const key =
        `${WAR_INFO_KEY}:${warId}`;

    const cached =
        await getCache(key);

    if (cached) {
        return {
            data: cached.data,
            cached: true,
            cachedAt: cached.cachedAt,
        };
    }

    const data =
        await fetchHelldivers(
            `/raw/api/WarSeason/${warId}/WarInfo`,
        );

    await setCache(
        key,
        data,
        WAR_INFO_TTL,
    );


    return {
        data,
        cached: false,
        cachedAt: Date.now(),
    };
}


/* -------------------------------------------------------------------------- */
/* Stale fallback                                                             */
/* -------------------------------------------------------------------------- */

async function getStaleData() {
    const [
        planets,
        warId,
    ] = await Promise.all([
        getCache(PLANETS_KEY),
        getCache(WAR_ID_KEY),
    ]);

    let warInfo = null;

    const currentWarId =
        warId?.data?.id;

    if (currentWarId) {
        warInfo =
            await getCache(
                `${WAR_INFO_KEY}:${currentWarId}`,
            );
    }

    if (!planets && !warInfo) {
        return null;
    }

    return {
        planets: planets?.data ?? [],
        warId: warId?.data ?? null,
        warInfo: warInfo?.data ?? null,

        databaseStatus: {
            state: 'warning',
            label: 'STALE',
            cached: true,
        },
    };
}


/* -------------------------------------------------------------------------- */
/* Vercel Function                                                            */
/* -------------------------------------------------------------------------- */

export default async function handler(
    request,
    response,
) {
    if (request.method !== 'GET') {
        return response
            .status(405)
            .json({
                error: 'Method not allowed.',
            });
    }

    try {
        /*
         * Planets and WarID can be fetched independently.
         *
         * If they are already cached, these are just Redis reads.
         */
        const [
            planetsResult,
            warIdResult,
        ] = await Promise.all([
            getPlanets(),
            getWarId(),
        ]);

        const warId =
            warIdResult?.data?.id;

        let warInfoResult = {
            data: null,
            cached: false,
            cachedAt: null,
        };

        if (warId) {
            warInfoResult =
                await getWarInfo(warId);
        }

        const anyFreshData =
            !planetsResult.cached ||
            !warIdResult.cached ||
            !warInfoResult.cached;

        return response
            .status(200)
            .json({
                planets:
                    planetsResult.data,

                warId:
                    warIdResult.data,

                warInfo:
                    warInfoResult.data,

                databaseStatus: {
                    state: 'online',
                    label: 'ONLINE',
                    cached: !anyFreshData,
                },
            });

    } catch (error) {
        console.error(
            '[SEAF] Galactic map API failed:',
            error,
        );

        /*
         * IMPORTANT:
         *
         * The upstream API failed.
         *
         * Try to serve the most recent Redis data instead
         * of giving the user a 503.
         */
        try {
            const stale =
                await getStaleData();

            if (stale) {
                console.warn(
                    '[SEAF] Serving stale Galactic War data.',
                );

                return response
                    .status(200)
                    .json({
                        ...stale,

                        databaseStatus: {
                            state: 'warning',
                            label: 'STALE',
                            cached: true,
                            error:
                                error?.message ||
                                'Upstream API unavailable.',
                        },
                    });
            }
        } catch (cacheError) {
            console.error(
                '[SEAF] Unable to retrieve stale cache:',
                cacheError,
            );
        }

        /*
         * No cached data exists.
         *
         * This is a genuine failure.
         */
        return response
            .status(503)
            .json({
                error:
                    error?.message ||
                    'Unable to retrieve Galactic War data.',

                databaseStatus: {
                    state: 'error',
                    label: 'OFFLINE',
                },
            });
    }
}
