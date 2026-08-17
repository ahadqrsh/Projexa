import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import { cn } from '@/utils/cn';

/**
 * The two source marks aren't proportioned the same: the dark-panel artwork
 * (icon + wordmark + tagline) is laid out taller/squarer (~1089x621, aspect
 * 1.75) than the light-panel one (~925x298, aspect 3.10). Rendered at the
 * same fixed height, the dark mark comes out visibly narrower and smaller
 * overall. This scales the dark image's height up so both read as the same
 * optical size instead of matching by raw pixel height.
 */
const DARK_SCALE = 1.77;

/**
 * Theme-aware logo mark. Renders both images and lets Tailwind's `dark:`
 * variant (backed by the `dark` class on <html>, see RootLayout) decide
 * which one is visible — no theme-reading JS needed, no flash on toggle.
 *
 * `size` is the light mark's height in px; the dark mark is scaled to match.
 * Pass `iconOnly` for tight spaces (e.g. a collapsed sidebar rail): both
 * marks are cropped to a fixed square via `object-cover`/`object-left`,
 * showing just the icon glyph at the left edge of the artwork instead of
 * the full icon+wordmark lockup.
 */
const Logo = ({ size = 36, className, iconOnly = false }) => {
  if (iconOnly) {
    return (
      <span
        className={cn('inline-block overflow-hidden', className)}
        style={{ width: size, height: size }}
      >
        <img
          src={logoLight}
          alt="Projexa"
          className="h-full w-full object-cover object-left dark:hidden"
        />
        <img
          src={logoDark}
          alt="Projexa"
          className="hidden h-full w-full object-cover object-left dark:block"
        />
      </span>
    );
  }

  return (
    <>
      <img
        src={logoLight}
        alt="Projexa"
        style={{ height: size }}
        className={cn('w-auto dark:hidden', className)}
      />
      <img
        src={logoDark}
        alt="Projexa"
        style={{ height: size * DARK_SCALE }}
        className={cn('hidden w-auto dark:block', className)}
      />
    </>
  );
};

export default Logo;
