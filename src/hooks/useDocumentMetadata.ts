import { useEffect } from 'preact/hooks';

interface MetadataProps {
  title?: string;
  description?: string;
  image?: string;
  video?: {
    url: string;
    type?: string;
    width?: number;
    height?: number;
  };
}

export function useDocumentMetadata({ title, description, image, video }: MetadataProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalTitle = "Chive — Recipes Made Simple";
    const originalDesc = "Chive — a community-driven recipe platform built on the AT Protocol. Discover and explore 3,300+ recipes living on Bluesky.";

    // Helper to resolve relative path to absolute URL
    const getAbsoluteUrl = (urlPath: string) => {
      if (!urlPath) return '';
      if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
        return urlPath;
      }
      return `${window.location.origin}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
    };

    // Update Title
    if (title) {
      document.title = `${title} | Chive`;
    } else {
      document.title = originalTitle;
    }

    const activeDesc = description || originalDesc;

    // Helper to set or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, contentVal: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    // Standard Description
    setMetaTag('meta[name="description"]', 'name', 'description', activeDesc);

    // OpenGraph Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title ? `${title} | Chive` : originalTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', activeDesc);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', getAbsoluteUrl(image || '/og-image.png'));
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', window.location.href);

    // Video OpenGraph Tags
    if (video) {
      const videoUrl = getAbsoluteUrl(video.url);
      setMetaTag('meta[property="og:video"]', 'property', 'og:video', videoUrl);
      setMetaTag('meta[property="og:video:secure_url"]', 'property', 'og:video:secure_url', videoUrl);
      setMetaTag('meta[property="og:video:type"]', 'property', 'og:video:type', video.type || 'video/mp4');
      if (video.width) setMetaTag('meta[property="og:video:width"]', 'property', 'og:video:width', String(video.width));
      if (video.height) setMetaTag('meta[property="og:video:height"]', 'property', 'og:video:height', String(video.height));
    }

    // Twitter Tags
    setMetaTag('meta[property="twitter:title"]', 'property', 'twitter:title', title ? `${title} | Chive` : originalTitle);
    setMetaTag('meta[property="twitter:description"]', 'property', 'twitter:description', activeDesc);
    setMetaTag('meta[property="twitter:image"]', 'property', 'twitter:image', getAbsoluteUrl(image || '/og-image.png'));
    setMetaTag('meta[property="twitter:url"]', 'property', 'twitter:url', window.location.href);

    return () => {
      // Cleanup / Reset to default
      document.title = originalTitle;
      
      const setMetaContent = (selector: string, contentVal: string) => {
        const el = document.querySelector(selector);
        if (el) el.setAttribute('content', contentVal);
      };

      const removeMetaTag = (selector: string) => {
        const el = document.querySelector(selector);
        if (el) el.remove();
      };
      
      setMetaContent('meta[name="description"]', originalDesc);
      setMetaContent('meta[property="og:title"]', originalTitle);
      setMetaContent('meta[property="og:description"]', originalDesc);
      setMetaContent('meta[property="og:image"]', getAbsoluteUrl('/og-image.png'));
      setMetaContent('meta[property="og:url"]', window.location.href);
      removeMetaTag('meta[property="og:video"]');
      removeMetaTag('meta[property="og:video:secure_url"]');
      removeMetaTag('meta[property="og:video:type"]');
      removeMetaTag('meta[property="og:video:width"]');
      removeMetaTag('meta[property="og:video:height"]');
      setMetaContent('meta[property="twitter:title"]', originalTitle);
      setMetaContent('meta[property="twitter:description"]', originalDesc);
      setMetaContent('meta[property="twitter:image"]', getAbsoluteUrl('/og-image.png'));
      setMetaContent('meta[property="twitter:url"]', window.location.href);
    };
  }, [title, description, image, video]);
}
