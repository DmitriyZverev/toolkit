/**
 * @public
 */
export type LogType = 'error' | 'warning' | 'info' | 'debug';

/**
 * @public
 */
export type Log = (type: LogType, message: string) => void;

/**
 * @public
 */
export const defaultLog: Log = (type, message) => {
    /* eslint-disable no-console */
    switch (type) {
        case 'error':
            console.error(message);
            break;
        case 'warning':
            console.warn(message);
            break;
        case 'info':
            console.info(message);
            break;
        case 'debug':
            console.debug(message);
            break;
        default:
            console.log(message);
    }
    /* eslint-enable no-console */
};
