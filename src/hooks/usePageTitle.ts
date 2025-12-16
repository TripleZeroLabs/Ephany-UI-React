import { useEffect } from "react";
import { SITE_TITLE } from "../config/site";

export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle
      ? `${pageTitle} | ${SITE_TITLE}`
      : SITE_TITLE;
  }, [pageTitle]);
}
