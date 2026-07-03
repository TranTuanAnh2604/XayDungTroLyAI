import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

/**
 * Shared type for MaterialIcons icon names.
 * Single source of truth — import from here instead of redefining locally.
 */
export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
