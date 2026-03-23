import { DataProvider } from './types';
import { DbProvider } from './dbProvider';
import { SsrsProvider } from './ssrsProvider';
import { Mode } from '../../../shared/types';

const providers: Partial<Record<Mode, DataProvider>> = {
  db: new DbProvider(),
  ssrs: new SsrsProvider()
};

export function getProvider(mode: Mode): DataProvider {
  const provider = providers[mode];

  if (!provider) {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  return provider;
}