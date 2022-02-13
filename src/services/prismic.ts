import { Client } from '@prismicio/client';
import fetch from 'node-fetch';

export function getPrismicClient(req?: unknown): Client {
  const prismic = new Client(process.env.PRISMIC_API_ENDPOINT, {
    fetch: async (url, options) => {
      return fetch(url);
    },
  });

  return prismic;
}
