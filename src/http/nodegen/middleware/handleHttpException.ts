import ErrorHandler from '@/services/ErrorHandler';

/**
 * Http Exception handler proxied through to the ErrorHandler service
 */
export default () => ErrorHandler.express;
