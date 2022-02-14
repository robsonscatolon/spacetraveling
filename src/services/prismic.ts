import { Client } from '@prismicio/client';

export function getPrismicClient(req?: unknown): Client {
  const prismic = new Client(process.env.PRISMIC_API_ENDPOINT, {
    req,
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  return prismic;
}
