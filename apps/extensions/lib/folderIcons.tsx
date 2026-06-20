import type { IconTypes } from "solid-icons";
import * as TablerIcons from "solid-icons/tb";
import { Dynamic } from "solid-js/web";

const DEFAULT_FOLDER_ICON_NAME = "IconFolder";
export const DEFAULT_FOLDER_ICON_COLOR = "#697080";

const TABLER_ICON_COMPONENTS = TablerIcons as unknown as Record<string, IconTypes | undefined>;

const toSolidTablerIconName = (iconName: string | null | undefined) => {
  if (!iconName?.startsWith("Icon")) {
    return "TbOutlineFolder";
  }

  return `TbOutline${iconName.slice("Icon".length)}`;
};

export const getTablerIconComponent = (iconName: string | null | undefined) =>
  TABLER_ICON_COMPONENTS[toSolidTablerIconName(iconName)] ??
  TABLER_ICON_COMPONENTS[toSolidTablerIconName(DEFAULT_FOLDER_ICON_NAME)]!;

export const TablerIcon = (props: {
  color?: string;
  name: string | null | undefined;
  size?: number;
  stroke?: number;
}) => (
  <Dynamic
    aria-hidden="true"
    color={props.color ?? "currentColor"}
    component={getTablerIconComponent(props.name)}
    size={props.size ?? 21}
    stroke-width={props.stroke ?? 1.5}
  />
);
