import { PrismicDocument } from '@prismicio/types';
import * as prismicH from '@prismicio/helpers';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: prismicH.LinkResolverFunction): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export const preview = async (req, res) => {
  const { token: ref, documentId } = req.query;
  const redirectUrl = await getPrismicClient(req).resolvePreviewURL({
    linkResolver,
    documentID: documentId as string,
    defaultURL: "/",
    previewToken: ref as string
  });

  console.log(documentId, redirectUrl);
  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();
};

export default preview;
