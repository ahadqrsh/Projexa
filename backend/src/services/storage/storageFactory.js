import env from '../../config/env.js';
import CloudinaryProvider from './CloudinaryProvider.js';
import LocalNoopProvider from './LocalNoopProvider.js';

let instance = null;

/** Factory + singleton. Consumers call getStorage(); nobody constructs a provider. */
export const getStorage = () => {
  if (!instance) {
    instance = env.cloudinaryEnabled ? new CloudinaryProvider() : new LocalNoopProvider();
  }
  return instance;
};

/** Test seam — lets a suite inject a fake without touching env. */
export const setStorage = (provider) => {
  instance = provider;
};

export default getStorage;
