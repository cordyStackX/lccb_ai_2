// utilities/Json_LD.ts
import setting from "@/config/conf/json_config/Metadata.json";

export default function Json_LD() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CordyStackX",
    "url": setting.domain__links,
    "publisher": {
      "@type": "Person",
      "name": "Cordova Marc Giestin Louis",
      "sameAs": [
        setting.links__src.Social__links.github,
      ]
    },
    "logo": {
      "@type": "ImageObject",
      "url": setting.openGraph
    }
  };
}