import {Log} from './runCli.js';

export const defaultLog: Log = (type, message) => {
    /* eslint-disable no-console */
    switch (type) {
        case 'error':
            console.error(message);
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
