/**
 * Inline theme bootstrap. Runs before first paint and must stay in sync with
 * `src/components/site/theme-toggle.tsx`'s storage key.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var s=localStorage.getItem('theme');
var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.dataset.theme=d?'dark':'light';
}catch(_){document.documentElement.dataset.theme='light';}})();`;
