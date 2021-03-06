import { BaseFactory } from '../../base/factory';
import { ThemeMedia } from '../../base/media';
import { createValueTransform } from './base';

export const spaceTransform = <
  Media extends ThemeMedia,
  Fact extends BaseFactory<Media>
>() =>
  createValueTransform<Media, Fact>()(
    [
      'm',
      'mx',
      'my',
      'ml',
      'mr',
      'mt',
      'mb',
      'p',
      'pl',
      'pt',
      'pr',
      'pb',
      'px',
      'py',
    ],
    (value, mediaType, mediaFn, factory) => {
      const baseValue = parseInt(factory.spacing.baseMultiplier);
      const multiplier =
        typeof value === 'string' ? parseInt(value as string) : 1;
      const ext = factory.spacing.baseMultiplier.replace(`${baseValue}`, '');
      const newValue = `${baseValue * multiplier}${ext}`;
      return newValue;
    }
  );
