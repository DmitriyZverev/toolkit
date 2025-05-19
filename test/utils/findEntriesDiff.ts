export type Entries<K extends string | number | symbol, V> = [K, V][] | Map<K, V> | Record<K, V>;

export type FindEntriesDiff = <K extends string | number | symbol, V>(
    initEntries: Entries<K, V>,
    changedEntries: Entries<K, V>,
) => Map<K, V>;

const normalizeEntries = <K extends string | number | symbol, V>(entries: Entries<K, V>): Map<K, V> => {
    return Array.isArray(entries)
        ? new Map(entries)
        : entries instanceof Map
          ? entries
          : (new Map(Object.entries(entries)) as Map<K, V>);
};

export const findEntriesDiff: FindEntriesDiff = (initEntries, changedEntries) => {
    const changedMap = normalizeEntries(changedEntries);
    const initMap = normalizeEntries(initEntries);
    const diffMap = new Map();
    changedMap.forEach((value, key) => {
        if (!initMap.has(key) || initMap.get(key) !== value) {
            diffMap.set(key, value);
        }
    });
    return diffMap;
};
